// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"flag"
	"log"
)

var (
	// flags
	optPort string
)

func main() {
	flag.StringVar(&optPort, "port", "8044", "HTTP server port")
	input := flag.String("input", "", "template file path")
	output := flag.String("output", "", "html file path")

	flag.Parse()

	if *input != "" && *output == "" {
		log.Fatal("[ERROR] no html template output path")
	}

	if *input != "" && *output != "" {
		tplMain(*input, *output)
		return
	}

	httpMain()
}
