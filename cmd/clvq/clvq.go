// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"flag"
	"log"
)

var (
	// flags
	optPort       string
	optTplDir     string
	optTplBase    string
	optTplIndex   string
	optStaticDir  string
	optConfigFile string
)

func main() {
	flag.StringVar(&optPort, "port", "8044", "HTTP server port")

	flag.StringVar(&optTplDir, "tpl", "tpl", "html template dir path")
	flag.StringVar(&optTplBase, "tpl.base", "base.html", "base html template")
	flag.StringVar(&optTplIndex, "tpl.index", "index.html", "index html filename")

	flag.StringVar(&optStaticDir, "static", "static", "static dir path")

	flag.StringVar(&optConfigFile, "c", "clvq.json", "config file path")

	input := flag.String("i", "", "template file path")
	output := flag.String("o", "", "html file path")

	flag.Parse()

	if err := configLoad(optConfigFile); err != nil {
		log.Fatalf("[ERROR] %v", err)
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
