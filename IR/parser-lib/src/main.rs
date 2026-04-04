use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;

use dk_ir::parse_file;

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(msg) => {
            eprintln!("{msg}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<(), String> {
    let mut args = env::args().skip(1);
    let mut in_path: Option<PathBuf> = None;
    let mut out_path: Option<PathBuf> = None;
    let mut ast = false;

    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--ast" => ast = true,
            "--pretty" => ast = false,
            "-o" | "--out" => {
                let path = args
                    .next()
                    .ok_or_else(|| "missing path after --out".to_string())?;
                out_path = Some(PathBuf::from(path));
            }
            "-h" | "--help" => {
                print_help();
                return Ok(());
            }
            _ if arg.starts_with('-') => return Err(format!("unknown flag: {arg}")),
            _ => {
                if in_path.is_some() {
                    return Err("only one input file is supported".to_string());
                }
                in_path = Some(PathBuf::from(arg));
            }
        }
    }

    let in_path = in_path.ok_or_else(|| "missing input file".to_string())?;
    let doc = parse_file(&in_path).map_err(|err| err.to_string())?;
    let out = if ast {
        format!("{doc:#?}\n")
    } else {
        format!("{}\n", doc.pretty())
    };

    if let Some(path) = out_path {
        fs::write(path, out).map_err(|err| err.to_string())?;
    } else {
        print!("{out}");
    }

    Ok(())
}

fn print_help() {
    println!("dk_ir <input> [--ast] [-o <path>]");
    println!("dk_ir <input> [--pretty] [-o <path>]");
}
