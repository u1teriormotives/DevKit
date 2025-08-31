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
	RWE os.FileMode = 0644
	RW  os.FileMode = 0755
)

type RouteConfig struct {
	Route    string `json:"router"`
	FilePath string `json:"mainFilePath"`
}

const ROUTER_JAVASCRIPT_ENDPOINT string = "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/JavaScript/index.js"
const DKROUTE_ENPOINT string = "https://github.com/u1teriormotives/DevKit/raw/refs/heads/main/Routing/DKRoute.json"

func currentDirectory() (string, error) {
	dir, e := os.Getwd()
	return dir, e
}

func currentTime() string {
	var now = time.Now()
	var hours = strconv.Itoa(now.Local().Hour())
	var minutes = strconv.Itoa((now.Local().Minute()))

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

var root = &cobra.Command{
	Use: "dkpm",
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
		}
	},
}

func init() {
	routeFetch.Flags().StringVarP(&routerVersion, "router", "r", "javascript", "the router version to install")
	fetchCommand.AddCommand(routeFetch)
	root.AddCommand(fetchCommand)
}

func main() {
	if e := root.Execute(); e != nil {
		fmt.Fprintln(os.Stderr, currentTime()+" -> ERROR: ", e)
		os.Exit(1)
	}
}
