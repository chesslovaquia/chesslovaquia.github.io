// Copyright Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

package main

import (
	"encoding/json"
	"log"
	"mime"
	"net/http"
)

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
