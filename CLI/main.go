package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

var binaryLocation = os.Args[0]

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

func currentDirectory() (string, error) {
	dir, e := os.Getwd()
	return dir, e
}

func directory() error {
	dir, e := currentDirectory()
	if e != nil {
		return e
	}
	e = os.Mkdir(filepath.Join(dir, ".dk"), RW)

	if e != nil {
		return e
	}

	return nil
}

func main() {
	argc := len(os.Args) - 1
	argv := make([]string, argc)

	dir, e := currentDirectory()
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
		switch routeType {
		case "js", "javascript":
			{
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
				fmt.Println("Running \x1b[97mnpm i express\x1b[0m")
				cmd := exec.Command("npm", "i", "express")
				out, e := cmd.CombinedOutput()
				if e != nil {
					panic(e)
				}
				fmt.Println("Output from npm:", string(out))

				e = directory()
				if e != nil {
					panic(e)
				}
				const cont string = `{
  "router": "javascript",
  "mainFilePath": "%s"
}`
				e = file(filepath.Join(dir, ".dk", "route-config.json"), fmt.Sprintf(cont, filepath.Join(dir, "route.js")), RW)
				if e != nil {
					panic(e)
				}
			}
		case "c#", "c-sharp", "csharp":
			{
				fmt.Println("Making files...")
				for i := 0; i < len(CSHARP_ENDPOINTS); i++ {
					var endpoint string = CSHARP_ENDPOINTS[i]
					res, e := http.Get(endpoint)
					if e != nil {
						panic(e)
					}
					defer res.Body.Close()

					body, e := io.ReadAll(res.Body)
					if e != nil {
						panic(e)
					}

					var fileSplit = strings.Split(endpoint, "/")
					var fileName = fileSplit[len(fileSplit)-1]
					var filePath = filepath.Join(dir, fileName)

					e = file(filePath, string(body), RW)
					if e != nil {
						panic(e)
					}
				}
				var path string = filepath.Join(dir, "DKRoute.json")
				res, e := http.Get(DKROUTE_ENPOINT)
				if e != nil {
					panic(e)
				}
				defer res.Body.Close()
				body, e := io.ReadAll(res.Body)
				if e != nil {
					panic(e)
				}
				e = file(path, string(body), RW)
				if e != nil {
					panic(e)
				}

				e = directory()
				if e != nil {
					panic(e)
				}
				const cont string = `{
  "router": "javascript",
  "mainFilePath": "%s"
}`
				e = file(filepath.Join(dir, ".dk", "route-config.json"), fmt.Sprintf(cont, filepath.Join(dir, "Program.cs")), RW)
				if e != nil {
					panic(e)
				}
			}
		}
	}
}
