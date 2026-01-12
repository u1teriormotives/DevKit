package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/spf13/cobra"
)

const (
	RWE os.FileMode = 0755
	RW  os.FileMode = 0644
)
const (
	DKPM_VERSION string = "v0.1.0-beta"
)

type RouteConfig struct {
	Route    string `json:"router"`
	FilePath string `json:"mainFilePath"`
}

const ROUTER_JAVASCRIPT_ENDPOINT string = "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/JavaScript/index.js"
const DKROUTE_ENPOINT string = "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/DKRoute.json"
const DEFAULT_INDEX_FILE string = "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/generic_index.html"

func getCSharpEndpoints() []string {
	return []string{
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/ProcessHandler.cs",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/Program.cs",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/appsettings.Development.json",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/appsettings.json",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/route.csproj",
	}
}

var ROUTER_CSHARP_ENDPOINTS []string = getCSharpEndpoints()

func currentDirectory() (string, error) {
	dir, e := os.Getwd()
	return dir, e
}

func currentTime() string {
	var now = time.Now()
	var hours = strconv.Itoa(now.Local().Hour())
	var minutes = strconv.Itoa((now.Local().Minute()))
	if now.Local().Minute() < 10 {
		minutes = "0" + minutes
	}

	return "\x1b[4;94;40mDEVKIT\x1b[0m::\x1b[4;94;40m" + hours + ":" + minutes + "\x1b[0m"
}

func fetch(ctx context.Context, url string) ([]byte, error) {
	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 5 * time.Second,
	}
	client := &http.Client{
		Transport: transport,
		Timeout:   10 * time.Second,
	}

	req, e := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if e != nil {
		return nil, fmt.Errorf(currentTime()+" -> failed to create request: %w", e)
	}

	res, e := client.Do(req)
	fmt.Println(currentTime()+" -> attempting request @", url)
	if e != nil {
		return nil, fmt.Errorf(currentTime()+" -> request failed: %w", e)
	}
	fmt.Println(currentTime()+" -> requested resource @", url, "has returned")
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(currentTime()+" -> bad status: %w", res.StatusCode)
	}

	body, e := io.ReadAll(res.Body)
	if e != nil {
		return nil, fmt.Errorf(currentTime()+" -> failed to read body: %w", e)
	}
	return body, nil
}

func getRouteConfiguration() (RouteConfig, error) {
	dir, e := currentDirectory()
	if e != nil {
		return RouteConfig{"s", "s"}, e
	}

	var p = filepath.Join(dir, ".dk", "route-config.json")
	_, e = os.Stat(p)
	if e == nil {
		cont, e := os.ReadFile(p)
		if e != nil {
			return RouteConfig{"s", "s"}, e
		}
		var d RouteConfig
		_ = json.Unmarshal(cont, &d)
		return d, nil
	} else {
		return RouteConfig{"s", "s"}, e
	}
}

func file(path string, content string, mode os.FileMode) error {
	f, e := os.Create(path)
	if e != nil {
		return e
	}
	defer f.Close()
	fmt.Println(currentTime()+" -> created file @", path)

	_, e = f.WriteString(content)
	if e != nil {
		return e
	}
	fmt.Println(currentTime()+" -> written content to", path)

	e = os.Chmod(path, mode)
	if e != nil {
		return e
	}
	fmt.Println(currentTime()+" -> modified permissions for", path, "to be", mode)

	return nil
}

func dkDirectory_Route(routerType string, path string) error {
	dir, e := currentDirectory()
	if e != nil {
		_, e = os.Stat(filepath.Join(dir, ".dk"))
		if e == nil {
			_, e = os.Stat(filepath.Join(dir, ".dk", "route-config.json"))
			if e != nil {
				_, e = os.Create(filepath.Join(dir, ".dk", "route-config.json"))
				if e != nil {
					return e
				}
			}
			var d string = "{ \"router\": \"%s\" \"mainFilePath\": \"%s\"}"
			e = file(path, fmt.Sprintf(d, routerType, path), RW)
			if e != nil {
				return e
			}
		}
		return nil
	} else {
		return e
	}
}

var (
	filePath_DKROUTE string
)

func dkRouteFile() error {
	dir, e := currentDirectory()
	if e != nil {
		return e
	}

	var DKRoutePresetData string = `[
  {
    "route": "/",
    "file": "index.html",
    "type": "html",
    "requestType": "GET"
  }
]`
	e = file(filepath.Join(dir, filePath_DKROUTE), DKRoutePresetData, RW)
	if e != nil {
		return e
	} else {
		return nil
	}
}

var (
	flag_Version bool
)

var root = &cobra.Command{
	Use:   "dkpm",
	Short: "the devkit package manager",
	Run: func(cmd *cobra.Command, args []string) {
		if flag_Version {
			fmt.Println(currentTime()+" -> dkpm version:", string(DKPM_VERSION))
		}
	},
}

var (
	routerVersion string
)
var fetchCommand = &cobra.Command{
	Use:   "fetch",
	Short: "fetch a package from DevKit",
}
var routeFetch = &cobra.Command{
	Use:   "route",
	Short: "fetch a router",
	Run: func(cmd *cobra.Command, args []string) {
		switch routerVersion {
		case "javascript", "js":
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()

			body, e := fetch(ctx, ROUTER_JAVASCRIPT_ENDPOINT)
			if e != nil {
				panic(e)
			}
			dir, e := currentDirectory()
			if e != nil {
				panic(e)
			}

			content := string(body)

			path := filepath.Join(dir, "route.js")
			e = file(path, content, RWE)
			if e != nil {
				panic(e)
			}
			e = dkDirectory_Route("javascript", path)
			if e != nil {
				panic(e)
			}
		case "c#", "csharp", "c-sharp":
			for i := 0; i < len(ROUTER_CSHARP_ENDPOINTS); i++ {
				var endpoint string = ROUTER_CSHARP_ENDPOINTS[i]
				ctx, cancel := context.WithCancel(context.Background())
				defer cancel()

				body, e := fetch(ctx, endpoint)
				if e != nil {
					panic(e)
				}
				dir, e := currentDirectory()
				if e != nil {
					panic(e)
				}

				content := string(body)

				path := filepath.Join(dir, filepath.Base(endpoint))
				e = file(path, content, RWE)
				if e != nil {
					panic(e)
				}
				e = dkDirectory_Route("csharp", path)
				if e != nil {
					panic(e)
				}
			}
		}
	},
}

var makeFileCommand = &cobra.Command{
	Use:   "make",
	Short: "make a file from devkit presets",
}
var makeDKRouteFileCommand = &cobra.Command{
	Use:   "dkroute",
	Short: "make the DKRoute.json file",
	Run: func(cmd *cobra.Command, args []string) {
		e := dkRouteFile()
		if e != nil {
			panic(e)
		}
	},
}
var makeDefaultIndexHtmlFileCommand = &cobra.Command{
	Use:   "index",
	Short: "make a default index.html file",
	Run: func(cmd *cobra.Command, args []string) {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		body, e := fetch(ctx, DEFAULT_INDEX_FILE)
		if e != nil {
			panic(e)
		}
		dir, e := currentDirectory()
		content := string(body)
		path := filepath.Join(dir, "index.html")
		file(path, content, RW)
	},
}

func init() {
	routeFetch.Flags().StringVarP(&routerVersion, "router", "r", "javascript", "the router version to install")
	makeDKRouteFileCommand.Flags().StringVarP(&filePath_DKROUTE, "path", "p", "DKRoute.json", "where the file should be")
	makeFileCommand.AddCommand(makeDKRouteFileCommand)
	makeFileCommand.AddCommand(makeDefaultIndexHtmlFileCommand)
	fetchCommand.AddCommand(routeFetch)
	root.Flags().BoolVarP(&flag_Version, "version", "v", false, "prints the current version of the CLI")
	root.AddCommand(makeFileCommand)
	root.AddCommand(fetchCommand)
}

func main() {
	if e := root.Execute(); e != nil {
		fmt.Fprintln(os.Stderr, currentTime()+" -> ERROR: ", e)
		os.Exit(1)
	}
}
