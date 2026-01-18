// Store current user info
let currentUserId = null;

document.addEventListener("DOMContentLoaded", async () => {
    // First, get current user info
    await loadCurrentUser();
    // Then load the feed
    loadFeed();
});

// Check if URL is a PDF
function isPdfUrl(url) {
    if (!url) return false;
    return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

async function loadCurrentUser() {
    try {
        const response = await apiFetch("/auth/me");
        if (response.ok) {
            const user = await response.json();
            currentUserId = user.id;
        }
    } catch (err) {
        console.error("Failed to load current user:", err);
    }
}

async function loadFeed() {
    const feedContainer = document.getElementById("feed-container");
    try {
        const response = await apiFetch("/posts/");
        if (response.ok) {
            const posts = await response.json();
            feedContainer.innerHTML = "";
            for (const post of posts) {
                const postElement = createPostElement(post);
                feedContainer.appendChild(postElement);
                // Load like count
                updateLikeCount(post.id);
            }
        } else {
            feedContainer.innerHTML = "<p>Please login to view the feed.</p>";
        }
    } catch (err) {
        console.error(err);
    }
}


function createPostElement(post) {
    const div = document.createElement("div");
    div.className = "post-card";
    div.id = `post-${post.id}`;

    // Check if current user is the post owner
    const isOwner = currentUserId && post.user_id === currentUserId;
    const actionButtonsHtml = isOwner
        ? `<div class="action-buttons">
               <button class="edit-btn" onclick="startEditPost(${post.id}, '${escapeHtmlAttr(post.title)}')" title="Edit post">✏️</button>
               <button class="delete-btn" onclick="deletePost(${post.id})" title="Delete post">🗑️</button>
           </div>`
        : '';

    // Header & Image
    div.innerHTML = `
        <div class="post-header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="user-info" style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="${post.user.profile_picture_url || '/static/myvillage.png'}" 
                         style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; background: #eee;">
                    <span style="font-weight: bold;">${escapeHtml(post.user.username || 'User ' + post.user_id)}</span>
                </div>
                ${actionButtonsHtml}
            </div>
            <div class="post-title" id="post-title-${post.id}" style="margin-top: 0.5rem;">${escapeHtml(post.title)}</div>
            <div id="post-title-edit-${post.id}" style="display: none; margin-top: 0.5rem;">
                <input type="text" id="post-title-input-${post.id}" class="edit-input" value="${escapeHtmlAttr(post.title)}">
                <div class="edit-actions">
                    <button class="save-btn" onclick="saveEditPost(${post.id})">Save</button>
                    <button class="cancel-btn" onclick="cancelEditPost(${post.id}, '${escapeHtmlAttr(post.title)}')">Cancel</button>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: #667;">${new Date(post.created_at).toLocaleString()}</div>
        </div>
       ${isPdfUrl(post.image_url)? `
                <div class="post-pdf">
                    <iframe
                        src="${post.image_url}"
                        class="post-pdf-frame"
                        title="${escapeHtmlAttr(post.title)}">
                    </iframe>
                    <div style="margin-top: 0.5rem;">
                        <a href="${post.image_url}" target="_blank" rel="noopener noreferrer">
                            Open PDF in new tab
                        </a>
                    </div>
                </div>
              `
            : `
                <img src="${post.image_url}"
                     class="post-image"
                     alt="${escapeHtmlAttr(post.title)}">
              `
        }
        <div class="post-actions">
            <button class="like-btn" id="like-btn-${post.id}" onclick="toggleLike(${post.id})">
                Like <span id="like-count-${post.id}">0</span>
            </button>
            <button class="comment-toggle" onclick="toggleComments(${post.id})">
                Comments
            </button>
        </div>
        <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
            <div id="comments-list-${post.id}"></div>
            <form onsubmit="postComment(event, ${post.id})" style="margin-top: 1rem;">
                <div class="form-group">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." required>
                </div>
                <button type="submit" style="width: auto; padding: 0.5rem 1rem;">Post</button>
            </form>
        </div>
    `;
    return div;
}

// Post Edit Functions
function startEditPost(postId, currentTitle) {
    document.getElementById(`post-title-${postId}`).style.display = 'none';
    document.getElementById(`post-title-edit-${postId}`).style.display = 'block';
    document.getElementById(`post-title-input-${postId}`).value = currentTitle;
    document.getElementById(`post-title-input-${postId}`).focus();
}

function cancelEditPost(postId, originalTitle) {
    document.getElementById(`post-title-${postId}`).style.display = 'block';
    document.getElementById(`post-title-edit-${postId}`).style.display = 'none';
    document.getElementById(`post-title-input-${postId}`).value = originalTitle;
}

async function saveEditPost(postId) {
    const newTitle = document.getElementById(`post-title-input-${postId}`).value.trim();
    if (!newTitle) {
        alert("Title cannot be empty");
        return;
    }

    try {
        const response = await apiFetch(`/posts/${postId}`, {
            method: "PUT",
            body: JSON.stringify({ title: newTitle })
        });

        if (response.ok) {
            const updatedPost = await response.json();
            // Update the title in the DOM
            document.getElementById(`post-title-${postId}`).textContent = updatedPost.title;
            document.getElementById(`post-title-${postId}`).style.display = 'block';
            document.getElementById(`post-title-edit-${postId}`).style.display = 'none';

            // Update the edit button with new title
            const editBtn = document.querySelector(`#post-${postId} .edit-btn`);
            if (editBtn) {
                editBtn.setAttribute('onclick', `startEditPost(${postId}, '${escapeHtmlAttr(updatedPost.title)}')`);
            }
        } else {
            const err = await response.json();
            alert(err.detail || "Failed to update post");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to update post");
    }
}

// Comment Edit Functions
function startEditComment(commentId, postId, currentText) {
    document.getElementById(`comment-text-${commentId}`).style.display = 'none';
    document.getElementById(`comment-edit-${commentId}`).style.display = 'block';
    document.getElementById(`comment-input-edit-${commentId}`).value = currentText;
    document.getElementById(`comment-input-edit-${commentId}`).focus();
}

function cancelEditComment(commentId) {
    document.getElementById(`comment-text-${commentId}`).style.display = 'block';
    document.getElementById(`comment-edit-${commentId}`).style.display = 'none';
}

async function saveEditComment(commentId, postId) {
    const newText = document.getElementById(`comment-input-edit-${commentId}`).value.trim();
    if (!newText) {
        alert("Comment cannot be empty");
        return;
    }

    try {
        const response = await apiFetch(`/comments/${commentId}`, {
            method: "PUT",
            body: JSON.stringify({ text: newText })
        });

        if (response.ok) {
            // Reload comments to show updated content
            loadComments(postId);
        } else {
            const err = await response.json();
            alert(err.detail || "Failed to update comment");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to update comment");
    }
}

async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post? This will also delete all comments and likes.")) {
        return;
    }

    try {
        const response = await apiFetch(`/posts/${postId}`, { method: "DELETE" });
        if (response.ok || response.status === 204) {
            // Remove the post from DOM
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
                postElement.remove();
            }
        } else {
            const err = await response.json();
            alert(err.detail || "Failed to delete post");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to delete post");
    }
}

async function deleteComment(commentId, postId) {
    if (!confirm("Are you sure you want to delete this comment?")) {
        return;
    }

    try {
        const response = await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
        if (response.ok || response.status === 204) {
            // Reload comments
            loadComments(postId);
        } else {
            const err = await response.json();
            alert(err.detail || "Failed to delete comment");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to delete comment");
    }
}

// Optimistic Like Toggle
async function toggleLike(postId) {
    const btn = document.getElementById(`like-btn-${postId}`);
    const countSpan = document.getElementById(`like-count-${postId}`);

    // Toggle visual state immediately (optimistic)
    const isLiked = btn.classList.contains("liked");
    if (isLiked) {
        btn.classList.remove("liked");
        countSpan.textContent = parseInt(countSpan.textContent) - 1;
    } else {
        btn.classList.add("liked");
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
    }

    try {
        const response = await apiFetch(`/likes/${postId}`, { method: "POST" });
        if (response.ok) {
            const data = await response.json();
            // Correct state from server
            if (data.liked) {
                btn.classList.add("liked");
            } else {
                btn.classList.remove("liked");
            }
            countSpan.textContent = data.count;
        } else {
            // Revert on error
            if (isLiked) {
                btn.classList.add("liked");
                countSpan.textContent = parseInt(countSpan.textContent) + 1;
            } else {
                btn.classList.remove("liked");
                countSpan.textContent = parseInt(countSpan.textContent) - 1;
            }
        }
    } catch (err) {
        console.error(err);
    }
}

async function updateLikeCount(postId) {
    try {
        const response = await apiFetch(`/likes/${postId}/count`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById(`like-count-${postId}`).textContent = data.count;
        }
    } catch (err) { }
}

async function toggleComments(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    if (section.style.display === "none") {
        section.style.display = "block";
        loadComments(postId);
    } else {
        section.style.display = "none";
    }
}

async function loadComments(postId) {
    const list = document.getElementById(`comments-list-${postId}`);
    list.innerHTML = "Loading...";
    try {
        const response = await apiFetch(`/comments/post/${postId}`);
        if (response.ok) {
            const comments = await response.json();
            list.innerHTML = "";
            if (comments.length === 0) {
                list.innerHTML = "<p>No comments yet.</p>";
            } else {
                comments.forEach(c => {
                    const cDiv = document.createElement("div");
                    cDiv.className = "comment";
                    cDiv.id = `comment-${c.id}`;

                    // Check if current user is the comment owner
                    const isOwner = currentUserId && c.user_id === currentUserId;
                    const actionButtonsHtml = isOwner
                        ? `<div class="action-buttons">
                               <button class="edit-comment-btn" onclick="startEditComment(${c.id}, ${postId}, '${escapeHtmlAttr(c.text)}')" title="Edit comment">✏️</button>
                               <button class="delete-comment-btn" onclick="deleteComment(${c.id}, ${postId})" title="Delete comment">🗑️</button>
                           </div>`
                        : '';

                    cDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div class="comment-author" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                                <img src="${c.user.profile_picture_url || '/static/default_pfp.png'}" 
                                     style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; background: #eee;">
                                <span style="font-weight: bold; font-size: 0.9rem;">${escapeHtml(c.user.username || 'User ' + c.user_id)}</span>
                            </div>
                            ${actionButtonsHtml}
                        </div>
                        <div class="comment-text" id="comment-text-${c.id}">${escapeHtml(c.text)}</div>
                        <div id="comment-edit-${c.id}" style="display: none;">
                            <input type="text" id="comment-input-edit-${c.id}" class="edit-input" value="${escapeHtmlAttr(c.text)}">
                            <div class="edit-actions">
                                <button class="save-btn" onclick="saveEditComment(${c.id}, ${postId})">Save</button>
                                <button class="cancel-btn" onclick="cancelEditComment(${c.id})">Cancel</button>
                            </div>
                        </div>
                    `;
                    list.appendChild(cDiv);
                });
            }
        }
    } catch (err) {
        list.innerHTML = "Error loading comments";
    }
}

async function postComment(event, postId) {
    event.preventDefault();
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value;

    try {
        const response = await apiFetch(`/comments/post/${postId}`, {
            method: "POST",
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            input.value = "";
            loadComments(postId); // Refresh
        }
    } catch (err) {
        alert("Failed to post comment");
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeHtmlAttr(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}
