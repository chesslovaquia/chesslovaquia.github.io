// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func httpHandler(w http.ResponseWriter, r *http.Request) {
	reqPath := filepath.Clean(r.URL.Path)

	templatePath := filepath.Join("tpl", reqPath)
	if templatePath == "tpl" {
		templatePath = "tpl/index.html"
	}

	ext := filepath.Ext(templatePath)

	// parse html templates

	if ext == ".html" {
		if _, err := os.Stat(templatePath); os.IsNotExist(err) {
			log.Printf("404 %s - %v", reqPath, err)
			http.Error(w, "404 - not found", http.StatusNotFound)
			return
		}
		tmpl, err := tplGet(templatePath)
		if err != nil {
			log.Printf("500 %s - %v", reqPath, err)
			http.Error(w, "500 - Failed to load template", http.StatusInternalServerError)
			return
		}
		data := tplGetData(templatePath)
		if err := tmpl.Execute(w, data); err != nil {
			log.Printf("500 %s - %v", reqPath, err)
			http.Error(w, "500 - Failed to render template", http.StatusInternalServerError)
			return
		}
		log.Printf("200 %s", reqPath)
		return
	}

	// serve static files

	var filePath string
	if strings.HasPrefix(reqPath, "/.base/") {
		filePath = filepath.Join("/opt/clvq/src/base/static", strings.TrimPrefix(reqPath, "/.base/"))
	} else {
		filePath = filepath.Join(".", "static", reqPath)
	}
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Printf("404 %s - %v", reqPath, err)
		http.Error(w, "404 - not found", http.StatusNotFound)
		return
	}
	mimeType := mime.TypeByExtension(ext)
	w.Header().Set("Content-Type", mimeType)
	http.ServeFile(w, r, filePath)
	log.Printf("200 %s", reqPath)
}

func httpMain(port string) {
	http.HandleFunc("/", httpHandler)
	log.Printf("Starting server on :%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
