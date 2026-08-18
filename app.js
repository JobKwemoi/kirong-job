// ============================================================
// ➕ NEW CHAT — AUTO-SAVE CURRENT CHAT TO SHELVES
// ============================================================

function createNewChat() {

    // --------------------------------------------------------
    // 🧠 FIRST: SAVE CURRENT CHAT
    // --------------------------------------------------------

    const currentChat =
        getActiveChat();

    if (currentChat) {

        // Keep the latest conversation
        currentChat.history =
            Array.isArray(chatHistory)
                ? chatHistory.slice(-20)
                : [];

        // Give untitled chats a useful fallback title
        if (
            currentChat.title === "New Chat" &&
            chatHistory.length > 0
        ) {

            const firstUserMessage =
                chatHistory.find(
                    item =>
                        item?.role === "user"
                );

            if (firstUserMessage?.content) {

                currentChat.title =
                    makeChatTitle(
                        firstUserMessage.content
                    );

            }

        }

        currentChat.updatedAt =
            Date.now();

    }


    // --------------------------------------------------------
    // 💾 SAVE TO LOCAL STORAGE
    // --------------------------------------------------------

    saveChats();


    // --------------------------------------------------------
    // 🗂️ REFRESH CHAT SHELVES
    // --------------------------------------------------------

    renderShelves();


    // --------------------------------------------------------
    // ➕ CREATE BRAND NEW CHAT
    // --------------------------------------------------------

    const newChat =
        createChat("New Chat");


    chats.unshift(
        newChat
    );


    activeChatId =
        newChat.id;


    chatHistory = [];


    // --------------------------------------------------------
    // 💾 REMEMBER ACTIVE CHAT
    // --------------------------------------------------------

    localStorage.setItem(
        ACTIVE_CHAT_KEY,
        activeChatId
    );


    // --------------------------------------------------------
    // 💾 SAVE EVERYTHING
    // --------------------------------------------------------

    saveChats();


    // --------------------------------------------------------
    // 🖥️ RENDER EMPTY CHAT
    // --------------------------------------------------------

    renderChat();


    renderShelves();


    // --------------------------------------------------------
    // ✨ FOCUS INPUT
    // --------------------------------------------------------

    userInput?.focus();


    console.log(
        "➕ New chat created — previous chat automatically shelved."
    );

}
