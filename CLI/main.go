package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

const (
	RWE os.FileMode = 0644
	RW  os.FileMode = 0755
)

const ROUTER_JAVASCRIPT_ENDPOINT string = "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/JavaScript/index.js"
const DKROUTE_ENPOINT string = "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/DKRoute.json"

func currentTime() string {
	var now = time.Now()
	var hours = strconv.Itoa(now.Local().Hour())
	var minutes = strconv.Itoa((now.Local().Minute()))

	return "\x1b[4;94;40m" + hours + ":" + minutes + "\x1b[0m"
}

func getCSharpEndpoints() []string {
	return []string{
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/ProcessHandler.cs",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/Program.cs",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/appsettings.Development.json",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/appsettings.json",
		"https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/C%23/route.csproj",
	}
}

var CSHARP_ENDPOINTS []string = getCSharpEndpoints()

func file(path string, content string, mode os.FileMode) error {
	f, e := os.Create(path)
	if e != nil {
		return e
	}
	defer f.Close()
	fmt.Println("\x1b[4;94;40mDEVKIT\x1b[0m::"+currentTime()+" Created file @", path)

	_, e = f.WriteString(content)
	if e != nil {
		return e
	}
	fmt.Println("\x1b[4;94;40mDEVKIT\x1b[0m::"+currentTime()+" Written content to", path)

	e = os.Chmod(path, mode)
	if e != nil {
		return e
	}
	fmt.Println("\x1b[4;94;40mDEVKIT\x1b[0m::"+currentTime()+" Modified permissions for", path, "to be", mode)

	return nil
}

func main() {
	argc := len(os.Args) - 1
	argv := make([]string, argc)

	dir, e := os.Getwd()
	if e != nil {
		panic(e)
	}

	copy(argv, os.Args[1:])

	if argc < 2 {
		panic("Too little arguments!")
	}
	mainCommand := argv[0]
	if mainCommand == "route" || mainCommand == "router" {
		routeType := argv[1]
		if routeType == "js" || routeType == "javascript" {
			fmt.Println("Making files...")
			{
				res, e := http.Get(ROUTER_JAVASCRIPT_ENDPOINT)
				if e != nil {
					panic(e)
				}
				defer res.Body.Close()

				body, e := io.ReadAll(res.Body)
				if e != nil {
					panic(e)
				}
				var routePath string = filepath.Join(dir, "route.js")
				e = file(routePath, string(body), RWE)
				if e != nil {
					panic(e)
				}
			}
			{
				res, e := http.Get(DKROUTE_ENPOINT)
				if e != nil {
					panic(e)
				}
				defer res.Body.Close()

				body, e := io.ReadAll(res.Body)
				if e != nil {
					panic(e)
				}

				var dkRoutePath string = filepath.Join(dir, "DKRoute.json")
				e = file(dkRoutePath, string(body), RW)
				if e != nil {
					panic(e)
				}
			}
		}
	}
}
