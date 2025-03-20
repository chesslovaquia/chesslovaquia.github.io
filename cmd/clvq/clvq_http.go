// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func handler(w http.ResponseWriter, r *http.Request) {
	templatePath := filepath.Join("tpl", filepath.Clean(r.URL.Path))
	if templatePath == "tpl" {
		templatePath = "tpl/index.html"
	}
	if _, err := os.Stat(templatePath); os.IsNotExist(err) {
		log.Printf("404 %s - %v", r.URL.Path, err)
		http.Error(w, "404 - Template not found", http.StatusNotFound)
		return
	}

	tmpl, err := getTemplate(templatePath)
	if err != nil {
		log.Printf("500 %s - %v", r.URL.Path, err)
		http.Error(w, "500 - Failed to load template", http.StatusInternalServerError)
		return
	}

	data := getTemplateData(templatePath)

	if err := tmpl.Execute(w, data); err != nil {
		log.Printf("500 %s - %v", r.URL.Path, err)
		http.Error(w, "500 - Failed to render template", http.StatusInternalServerError)
		return
	}
}

func httpMain(port string) {
	http.HandleFunc("/", handler)
	log.Printf("Starting server on :%s", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
