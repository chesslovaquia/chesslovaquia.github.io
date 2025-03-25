// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"flag"
	"log"
	"os"
)

var (
	// os env
	envGoVersion string
)

func loadEnv() {
	envGoVersion = os.Getenv("GOVERSION")
	if envGoVersion == "" {
		panic("GOVERSION env var not set")
	}
}

var (
	// flags
	optPort       string
	optTplDir     string
	optTplBase    string
	optTplIndex   string
	optTplInc     string
	optTplBuild   string
	optTplMake    bool
	optStaticDir  string
	optConfigFile string
)

func Main() {
	loadEnv()
	newConfig()

	flag.StringVar(&optPort, "port", "8044", "HTTP server port")
	flag.StringVar(&optTplDir, "tpl", "tpl", "html template dir path")
	flag.StringVar(&optTplBase, "tpl.base", "base.html", "base html template")
	flag.StringVar(&optTplIndex, "tpl.index", "index.html", "index html filename")
	flag.StringVar(&optTplInc, "tpl.inc", "inc", "template include dirname")
	flag.StringVar(&optTplBuild, "tpl.build", "build.sh", "template build script name")
	flag.BoolVar(&optTplMake, "tpl.make", false, "make tpl build script")
	flag.StringVar(&optStaticDir, "static", "static", "static dir path")
	flag.StringVar(&optConfigFile, "c", "clvq.json", "config file path")

	input := flag.String("i", "", "template file path")
	output := flag.String("o", "", "html file path")

	flag.Parse()

	if optTplMake {
		tplMake()
		return
	}

	if *input != "" && *output == "" {
		log.Fatal("[ERROR] no html template output path")
	}

	if *input != "" && *output != "" {
		tplMain(*input, *output)
		return
	}

	httpMain()
}

func main() {
	Main()
}
