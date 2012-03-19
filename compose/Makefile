all: xmlToJSON JSONToxml

xmlToJSON: xmlToJSON.c
	gcc `pkg-config --cflags --libs libxml-2.0 json-glib-1.0` xmlToJSON.c -o xmlToJSON

JSONToxml: JSONToxml.c
	gcc `pkg-config --cflags --libs libxml-2.0 json-glib-1.0` JSONToxml.c -o JSONToxml

clean:
	rm xmlToJSON JSONToxml
