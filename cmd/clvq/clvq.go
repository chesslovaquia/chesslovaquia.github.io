// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"flag"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

var (
	tmplMutex sync.Mutex
	tmplCache *template.Template
)

func loadTemplate(path string) (*template.Template, error) {
	return template.ParseFiles("tpl/base.html", path)
}

func getTemplate(path string) (*template.Template, error) {
	tmplMutex.Lock()
	defer tmplMutex.Unlock()

	// Always reload template
	newTmpl, err := loadTemplate(path)
	if err != nil {
		return nil, err
	}
	return newTmpl, nil
}

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

	data := map[string]string{
		"Title":   "Live Reloading Go Server",
		"Message": "Modify the template file and refresh!",
	}

	if err := tmpl.Execute(w, data); err != nil {
		log.Printf("500 %s - %v", r.URL.Path, err)
		http.Error(w, "500 - Failed to render template", http.StatusInternalServerError)
		return
	}
}

func main() {
	port := flag.String("port", "8044", "HTTP server port")
	flag.Parse()

	http.HandleFunc("/", handler)
	log.Printf("Starting server on :%s", *port)

	if err := http.ListenAndServe(":"+*port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
