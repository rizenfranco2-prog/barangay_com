function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}
function getToken(){ return localStorage.getItem("barangay_token"); }
async function loadNotifications(){
  const container=document.getElementById("notificationList");
  try {
    const response=await fetch(`${API_URL}/api/notifications`, {
      headers:{Authorization:`Bearer ${getToken()}`}
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message || "Unable to load notifications.");
    const items=(data.notifications || []).filter(item=>!item.archived);
    if(!items.length){container.innerHTML='<p class="muted">You’re all caught up. No notifications yet.</p>';return;}
    container.innerHTML=items.map(item=>`
      <article class="notification-item ${item.read ? "read" : "unread"}">
        <p class="notification-message expandable-text is-collapsed">${escapeHTML(item.message)}</p>
        ${String(item.message || "").length > 180 ? '<button type="button" class="see-more-toggle" aria-expanded="false">See more...</button>' : ""}
        <small>${item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>
        ${!item.read ? `<button type="button" class="mark-read-btn" data-id="${escapeHTML(item._id)}">Mark as read</button>` : ""}
      </article>`).join("");
    container.querySelectorAll(".see-more-toggle").forEach(button=>button.addEventListener("click",()=>{
      const content=button.previousElementSibling;
      const expanded=button.getAttribute("aria-expanded")==="true";
      content.classList.toggle("is-collapsed",expanded);
      button.setAttribute("aria-expanded",String(!expanded));
      button.textContent=expanded?"See more...":"See less";
    }));
    container.querySelectorAll(".mark-read-btn").forEach(button=>button.addEventListener("click",async()=>{
      button.disabled=true;
      try {
        const res=await fetch(`${API_URL}/api/notifications/${encodeURIComponent(button.dataset.id)}/read`,{
          method:"PATCH",headers:{Authorization:`Bearer ${getToken()}`}
        });
        if(!res.ok) throw new Error("Could not mark notification as read.");
        await loadNotifications();
      } catch(err){button.disabled=false;alert(err.message || "Failed to update notification.");}
    }));
  } catch(error){container.textContent=error.message || "Unable to load notifications.";}
}
document.addEventListener("DOMContentLoaded",async()=>{
  if(!getToken()){location.href="index.html";return;}
  try {
    const res=await fetch(`${API_URL}/api/auth/me`,{headers:{Authorization:`Bearer ${getToken()}`}});
    const me=await res.json().catch(()=>({}));
    if(!res.ok || !me.account){localStorage.removeItem("barangay_token");location.href="index.html";return;}
    if(me.role!=="user"){location.href="admin-dashboard.html";return;}
    const account=me.account, name=account.name || "User";
    ["topName","profileName"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=name;});
    const email=document.getElementById("profileEmail");if(email)email.textContent=account.email || "";
    ["topAvatar","profileAvatar"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=name.split(/\s+/).slice(0,2).map(v=>v[0]||"").join("").toUpperCase();});
  } catch(e){console.error(e);}
  document.getElementById("logoutBtn")?.addEventListener("click",()=>{localStorage.removeItem("barangay_token");location.href="index.html";});
  loadNotifications();
});
