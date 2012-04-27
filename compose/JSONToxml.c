#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <glib.h>
#include <json-glib/json-glib.h>
#include <libxml/parser.h>
#include <libxml/tree.h>

static void
add_info (JsonObject  *object,
        const gchar *member_name,
        JsonNode    *member_node,
        xmlNodePtr  parent_node)
{
    xmlNodePtr node;
    gchar *content;
    gchar *name;
    name = json_node_type_name (member_node);
    if (strcmp (name, "gint64") == 0) {
        content = g_strdup_printf ("%d", json_node_get_int (member_node));
    } else if (strcmp (name, "gchararray") == 0) {
        content = g_strdup_printf ("%s", json_node_get_string (member_node));
    } else 
        return;
    node = xmlNewNode (NULL, member_name);
    xmlNodeAddContent (node, content);
    xmlAddChild(parent_node, node);
    g_free (content);
}

static void
verify_foreach (JsonObject  *object,
        const gchar *member_name,
        JsonNode    *member_node,
        gpointer     user_data)
{
    printf ("member name %s %s\n", member_name, json_node_type_name (member_node));
}

gchar *     
json_to_xml (const gchar *json_data, gint *len)
{
    JsonParser *parser;
    JsonNode *root, *node, *apps_node;
    JsonObject *object, *applications;
    JsonObject *meta_object, *data_array;
    JsonArray *array;
    GList *list, *l;
    GError *error; 
    gint i;
    gboolean res;

    xmlDocPtr doc = xmlNewDoc ("1.0");
    xmlNodePtr root_node = xmlNewNode(NULL, "ocs");
    xmlDocSetRootElement(doc,root_node);
    xmlNodePtr meta_node, data_node, app_node;

    meta_node = xmlNewNode(NULL, "meta");
    data_node = xmlNewNode(NULL, "data");


    parser = json_parser_new ();
    error = NULL;
    res = json_parser_load_from_data (parser, json_data, -1, &error);
    root = json_parser_get_root (parser);
    object = json_node_get_object (root);
    meta_object = json_object_get_object_member (object, "meta");
    json_object_foreach_member (meta_object, add_info, meta_node);

    data_array = json_object_get_array_member (object, "data");
    for (i = 0; i < json_array_get_length (data_array); i++) {
        object = json_array_get_object_element (data_array, i);
        app_node = xmlNewNode (NULL, "content");
        xmlAddChild(data_node,app_node);
        json_object_foreach_member (object, add_info, app_node);
    }

    xmlAddChild(root_node,meta_node);
    xmlAddChild(root_node,data_node);
    gchar *mem = NULL;
    xmlDocDumpMemory (doc, &mem, &i);
    return mem;
}

gint main ()
{
    gint len;
    gchar *json, *xml;

    g_type_init ();

    g_file_get_contents ("./list.json", &json, &len, NULL);
    xml = json_to_xml (json, &len);
    g_free (json);

    printf ("xml %s\n", xml);
    return 1;
}
