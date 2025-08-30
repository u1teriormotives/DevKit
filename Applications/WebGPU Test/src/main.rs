use std::{fs, path::Path};

use anyhow::Result;
use clap::Parser;
use futures::executor::block_on;
use regex::Regex;
use wgpu::util::StagingBelt;
use wgpu_glyph::{ab_glyph, GlyphBrushBuilder, Section, Text};
use winit::{
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};

#[derive(Debug)]
enum Node {
    H1(String),
}

fn currentdirectory() -> &'static Path {
    Path::new(env!("CARGO_MANIFEST_DIR"))
}

fn parse(input: &str) -> Vec<Node> {
    let mut nodes = Vec::new();
    let re_h1 = Regex::new(r"\[h1\]([\s\S]*?)\[/h1\]").unwrap();
    for cap in re_h1.captures_iter(input) {
        nodes.push(Node::H1(cap[1].trim().to_string()));
    }
    nodes
}

#[derive(Parser)]
#[command(author, version, about)]
struct Args {
    file: String,
}

fn main() -> Result<()> {
    let args = Args::parse();
    let raw = fs::read_to_string(&args.file)?;
    let nodes = parse(&raw);

    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title("DKX Renderer")
        .build(&event_loop)?;

    let size = window.inner_size();
    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
        backends: wgpu::Backends::all(),
        dx12_shader_compiler: Default::default(),
    });
    let surface = unsafe { instance.create_surface(&window)? };
    let adapter = block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
        power_preference: wgpu::PowerPreference::HighPerformance,
        force_fallback_adapter: false,
        compatible_surface: Some(&surface),
    }))
    .ok_or_else(|| anyhow::anyhow!("Failed to find GPU adapter"))?;
    let (device, queue) = block_on(adapter.request_device(
        &wgpu::DeviceDescriptor {
            label: None,
            features: wgpu::Features::empty(),
            limits: wgpu::Limits::default(),
        },
        None,
    ))?;

    let surface_caps = surface.get_capabilities(&adapter);
    let surface_format = surface_caps.formats[0];
    let mut config = wgpu::SurfaceConfiguration {
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
        format: surface_format,
        width: size.width,
        height: size.height,
        present_mode: wgpu::PresentMode::Fifo,
        alpha_mode: surface_caps.alpha_modes[0],
        view_formats: vec![],
    };
    surface.configure(&device, &config);

    let mut staging_belt = StagingBelt::new(1024);

    let font_data = fs::read(Path::new(currentdirectory()).join("src/Times New Roman.ttf"))?;
    let font = ab_glyph::FontArc::try_from_vec(font_data)?;
    let mut glyph_brush = GlyphBrushBuilder::using_font(font).build(&device, surface_format);

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Poll;
        match event {
            Event::RedrawRequested(_) => {
                let frame = surface
                    .get_current_texture()
                    .expect("Failed to acquire next swap-chain texture");
                let view = frame.texture.create_view(&Default::default());

                let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
                    label: Some("Render Encoder"),
                });

                encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                    label: Some("Clear Pass"),
                    color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                        view: &view,
                        resolve_target: None,
                        ops: wgpu::Operations {
                            load: wgpu::LoadOp::Clear(wgpu::Color::WHITE),
                            store: true,
                        },
                    })],
                    depth_stencil_attachment: None,
                });

                let mut y = 20.0;
                for node in &nodes {
                    if let Node::H1(text) = node {
                        glyph_brush.queue(Section {
                            screen_position: (20.0, y),
                            bounds: (config.width as f32 - 40.0, config.height as f32),
                            text: vec![Text::new(text).with_scale(48.0)],
                            ..Default::default()
                        });
                        y += 60.0;
                    }
                }

                glyph_brush
                    .draw_queued(
                        &device,
                        &mut staging_belt,
                        &mut encoder,
                        &view,
                        config.width,
                        config.height,
                    )
                    .expect("Draw queued text failed");

                staging_belt.finish();
                queue.submit(Some(encoder.finish()));
                staging_belt.recall();

                frame.present();
            }
            Event::MainEventsCleared => window.request_redraw(),
            Event::WindowEvent { event, .. } => match event {
                WindowEvent::Resized(new_size) => {
                    config.width = new_size.width;
                    config.height = new_size.height;
                    surface.configure(&device, &config);
                }
                WindowEvent::CloseRequested => *control_flow = ControlFlow::Exit,
                _ => {}
            },
            _ => {}
        }
    });
}
