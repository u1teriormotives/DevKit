package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
)

const ROUTER_JAVASCRIPT_ENDPOINT string = "https://github.com/vadotehla/DevKit/raw/refs/heads/main/Routing/JavaScript/index.js"
const DKROUTE_ENPOINT string = "https://github.com/vadotehla/DevKit/raw/refs/heads/main/Routing/DKRoute.json"

var ROUTER_CSHARP_ENDPOINT = [5]string{
	"https://github.com/vadotehla/DevKit/raw/refs/heads/main/Routing/C%23/ProcessHandler.cs",
	"https://github.com/vadotehla/DevKit/raw/refs/heads/main/Routing/C%23/Program.cs",
	"https://github.com/vadotehla/DevKit/raw/refs/heads/main/Routing/C%23/appsettings.Development.json",
	"https://github.com/vadotehla/DevKit/raw/refs/heads/main/Routing/C%23/appsettings.json",
	"https://github.com/vadotehla/DevKit/raw/refs/heads/main/Routing/C%23/route.csproj",
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

				body, e := ioutil.ReadAll(res.Body)
				if e != nil {
					panic(e)
				}
				var routePath string = filepath.Join(dir, "route.js")
				f, e := os.Create(routePath)
				if e != nil {
					panic(e)
				}
				defer f.Close()

				_, e = f.WriteString(string(body))
				if e != nil {
					panic(e)
				}
				fmt.Println("Written JavaScript router to", routePath)

				e = os.Chmod(routePath, 0755)
				if e != nil {
					panic(e)
				}
				fmt.Println("Modified", routePath, "to allow for manual execution via the command line!")
			}
			{
				res, e := http.Get(DKROUTE_ENPOINT)
				if e != nil {
					panic(e)
				}
				defer res.Body.Close()

				body, e := ioutil.ReadAll(res.Body)
				if e != nil {
					panic(e)
				}

				var dkRoutePath string = filepath.Join(dir, "DKRoute.json")
				f, e := os.Create(dkRoutePath)
				if e != nil {
					panic(e)
				}
				defer f.Close()

				_, e = f.WriteString(string(body))
				if e != nil {
					panic(e)
				}
				fmt.Println("Written DKRoute.json example to", dkRoutePath)
			}
		}
	}
}
