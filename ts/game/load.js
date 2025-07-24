// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

{{- $cdn := site.Params.cdn }}
{{- with site.Params.game_assets }}
	{{- range . }}
fetch("{{ $cdn }}/{{ . }}");
	{{- end }}
{{- end }}
