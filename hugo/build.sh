#!/bin/sh
exec hugo \
	--environment production \
	--baseURL http://localhost:8000/ \
	--logLevel warning
