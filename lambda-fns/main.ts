import deleteBookmark from "./deleteBookmark";
import listBookmark from "./listBookmark";
import createBookmark from "./createBookmark";

type Bookmark = {
    id: String
    name: String
    url: String
}


type AppSyncEvent = {
    info: {
        fieldName: String
    },
    arguments: {
        noteId: String
        bookmark: Bookmark
    }
}


exports.handler = async (event: AppSyncEvent) => {
    switch (event.info.fieldName) {
        case "listBookmark":
            return await listBookmark();
        case "deleteBookmark":
            return await deleteBookmark(event.arguments.noteId);
        case "createBookmark":
            return await createBookmark(event.arguments.bookmark);
        default:
            return null;
    }
}