// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"encoding/json"
	"io"
	"log"
	"mime"
	"net/http"
)

// config.json

func adminConfigJSONHandler(w http.ResponseWriter, r *http.Request) {
	mimeType := mime.TypeByExtension(".json")
	w.Header().Set("Content-Type", mimeType)
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(cfg); err != nil {
		log.Printf("500 /_/config.json - %v", err)
		http.Error(w, "500 - Internal Server Error", http.StatusInternalServerError)
		return
	}
	log.Println("200 /_/config.json")
}

// tpl/build.sh

func adminTplBuildScriptHandler(w http.ResponseWriter, r *http.Request) {
	mimeType := mime.TypeByExtension(".txt")
	w.Header().Set("Content-Type", mimeType)
	w.WriteHeader(http.StatusOK)
	if _, err := io.WriteString(w, tplBuildScript()); err != nil {
		log.Printf("500 /_/tpl/build.sh - %v", err)
		http.Error(w, "500 - Internal Server Error", http.StatusInternalServerError)
		return
	}
	log.Println("200 /_/tpl/build.sh")
}
