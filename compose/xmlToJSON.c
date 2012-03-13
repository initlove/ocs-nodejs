#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <glib.h>
#include <json-glib/json-glib.h>
#include <libxml/parser.h>
#include <libxml/tree.h>


static JsonObject *
get_app_object (xmlNodePtr app_xml_node)
{
    if (!app_xml_node || !app_xml_node->name)
        return NULL;
    if (strcmp (app_xml_node->name, "application") != 0)
        return NULL;

    xmlNodePtr node, sub_node;
    JsonObject *object;
    JsonArray *array;
    gchar *content;
    
    object = json_object_new ();
    for (node = app_xml_node->xmlChildrenNode; node; node = node->next) {
        if (!node->name)
            continue;
        if ((strcmp (node->name, "appcategories") == 0) || (strcmp (node->name, "mimetypes") == 0)) {
            array = json_array_new ();
            for (sub_node = node->xmlChildrenNode; sub_node; sub_node = sub_node->next) {
                content = xmlNodeGetContent (sub_node);
                if (content && content [0])
                    json_array_add_string_element (array, content);
            }
            json_object_set_array_member (object, node->name, array);
        } else {
            content = xmlNodeGetContent (node);
            if (content && content [0])
                json_object_set_string_member (object, node->name, content);
        }
    }

    return object;
}

int
main (int argc, char *argv[])
{   
    xmlDocPtr doc_ptr;
    xmlNodePtr root_xml_node, app_xml_node;
      
    JsonGenerator *generator;
	JsonNode *root_json_node;
    JsonObject *root_json_object;
    JsonObject *json_object;
    JsonArray *array;
 
    gchar *xml_file; 
    gchar *json_file;
    GError *error;

    if (argc < 2) {
        printf ("usage: xmlToJSON xml_file json_file\n");
        printf ("\t xml_file default to ./appdata.xml\n");
        printf ("\t json_file default to ./appdata.json\n");
        xml_file = "./appdata.xml";
        json_file = "./appdata.json";
    } else if (argc == 2) {
        xml_file = "./appdata.xml";
        json_file = argv [1];
    } else {
        xml_file = argv [1];
        json_file = argv [2];
    }

	g_type_init ();
    doc_ptr = xmlParseFile (xml_file);
    if (!doc_ptr) {
        printf ("cannot parse %s\n", xml_file);
        return -1;
    }

    generator = json_generator_new ();
	root_json_node = json_node_new (JSON_NODE_OBJECT);
    root_json_object = json_object_new ();

    json_object_set_string_member (root_json_object, "repo", "http://example.repo.opensuse.org");

    root_xml_node = xmlDocGetRootElement (doc_ptr);
    array = json_array_new ();
    for (app_xml_node = root_xml_node->xmlChildrenNode; app_xml_node; app_xml_node = app_xml_node->next) {
        json_object = get_app_object (app_xml_node);
        json_array_add_object_element (array, json_object);
    }
    json_object_set_array_member (root_json_object, "applications", array);

    json_node_take_object (root_json_node, root_json_object);
    json_generator_set_root (generator, root_json_node);
    g_object_set (generator, "pretty", FALSE, NULL);

    error = NULL;
    json_generator_to_file (generator, json_file, &error);
    if (error) {
        printf ("error in generate json %s\n", error->message);
        g_error_free (error);
    }

    json_node_free (root_json_node);
    g_object_unref (generator);

    xmlFreeDoc (doc_ptr);

	return 0;
}
