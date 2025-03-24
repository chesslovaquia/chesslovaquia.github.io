// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"log"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

func httpHandler(w http.ResponseWriter, r *http.Request) {
	reqPath := filepath.Clean(r.URL.Path)
	if strings.HasSuffix(reqPath, "/") {
		reqPath = path.Join(reqPath, optTplIndex)
	}

	ext := filepath.Ext(reqPath)
	if ext == "" {
		reqPath = path.Join(reqPath, optTplIndex)
		ext = filepath.Ext(reqPath)
	}

	// parse html templates

	if ext == ".html" {
		templatePath := filepath.Join(optTplDir, reqPath)
		if _, err := os.Stat(templatePath); os.IsNotExist(err) {
			log.Printf("404 %s - %v", reqPath, err)
			http.Error(w, "404 - not found", http.StatusNotFound)
			return
		}
		t := newTpl(templatePath)
		tmpl, err := t.Get()
		if err != nil {
			log.Printf("500 %s - %v", reqPath, err)
			http.Error(w, "500 - Failed to load template", http.StatusInternalServerError)
			return
		}
		data := t.GetData()
		if err := tmpl.Execute(w, data); err != nil {
			log.Printf("500 %s - %v", reqPath, err)
			http.Error(w, "500 - Failed to render template", http.StatusInternalServerError)
			return
		}
		log.Printf("200 %s - %s %s", reqPath, t.BaseFile(), t.Path)
		return
	}

	// serve static files

	var filePath string
	if strings.HasPrefix(reqPath, "/.base/") {
		filePath = filepath.Join("/opt/clvq/src/base/static", strings.TrimPrefix(reqPath, "/.base/"))
	} else {
		filePath = filepath.Join(optStaticDir, reqPath)
	}
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Printf("404 %s - %v", reqPath, err)
		http.Error(w, "404 - not found", http.StatusNotFound)
		return
	}
	mimeType := mime.TypeByExtension(ext)
	w.Header().Set("Content-Type", mimeType)
	http.ServeFile(w, r, filePath)
	log.Printf("200 %s - %s", reqPath, filePath)
}

func httpMain() {
	http.HandleFunc("/", httpHandler)

	log.Printf("starting http server on port: %s", optPort)
	log.Printf("config filename: %s", optConfigFile)

	if err := configLoad(optConfigFile); err != nil {
		log.Fatalf("[ERROR] %v", err)
	}

	if err := http.ListenAndServe(":"+optPort, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
