(function () {
  if (!window.KB_CONFIG) {
    console.error("Missing config.js. Copy config.example.js to config.js first.");
    return;
  }

  const cfg = window.KB_CONFIG;
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  function setNotice(id, message, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "notice " + (ok ? "ok" : "err");
    el.textContent = message;
  }

  async function signInGoogle() {
    const origin = window.location.origin;
    const redirectTo = window.location.pathname.endsWith("member.html")
      ? origin + "/member.html"
      : origin + "/member.html";

    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });

    if (error) {
      setNotice("auth-status", "Sign-in failed: " + error.message, false);
      setNotice("member-status", "Sign-in failed: " + error.message, false);
    }
  }

  async function signOut() {
    await client.auth.signOut();
    window.location.href = "index.html";
  }

  async function submitRequest(ev) {
    ev.preventDefault();
    const form = ev.target;
    const payload = {
      full_name: form.name.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      reason: form.reason.value.trim()
    };

    const { error } = await client.from("user_requests").insert(payload);
    if (error) {
      setNotice("request-status", "Request failed: " + error.message, false);
      return;
    }

    form.reset();
    setNotice("request-status", "Request submitted. You will be reviewed for approval.", true);
  }

  async function loadMemberArea() {
    const statusElId = "member-status";

    const { data: authData } = await client.auth.getUser();
    const user = authData && authData.user;
    if (!user) {
      setNotice(statusElId, "Please sign in with Google.", false);
      return;
    }

    const email = (user.email || "").toLowerCase();
    const { data: approvedRows, error: approvedError } = await client
      .from("approved_users")
      .select("status")
      .eq("email", email)
      .limit(1);

    if (approvedError) {
      setNotice(statusElId, "Could not verify approval: " + approvedError.message, false);
      return;
    }

    const status = approvedRows && approvedRows[0] && approvedRows[0].status;
    if (status !== "approved") {
      setNotice(statusElId, "Your account is not approved yet.", false);
      return;
    }

    setNotice(statusElId, "Signed in and approved.", true);

    const { data: resources, error: rErr } = await client
      .from("resources")
      .select("title, category, domain, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: sessions, error: sErr } = await client
      .from("sessions")
      .select("session_date, session_time, topic, type")
      .order("session_date", { ascending: true })
      .limit(20);

    const rWrap = document.getElementById("resources-list");
    const sWrap = document.getElementById("sessions-list");

    if (rWrap) {
      if (rErr) rWrap.innerHTML = "<p class='lead'>Could not load resources.</p>";
      else if (!resources || !resources.length) rWrap.innerHTML = "<p class='lead'>No resources yet.</p>";
      else {
        rWrap.innerHTML = resources.map(function (r) {
          return "<div><strong>" + escapeHtml(r.title || "Untitled") + "</strong><br><span class='lead'>" +
            escapeHtml((r.category || "") + (r.domain ? " - " + r.domain : "")) + "</span></div><hr>";
        }).join("");
      }
    }

    if (sWrap) {
      if (sErr) sWrap.innerHTML = "<p class='lead'>Could not load sessions.</p>";
      else if (!sessions || !sessions.length) sWrap.innerHTML = "<p class='lead'>No sessions yet.</p>";
      else {
        sWrap.innerHTML = sessions.map(function (s) {
          return "<div><strong>" + escapeHtml(s.topic || "Session") + "</strong><br><span class='lead'>" +
            escapeHtml((s.session_date || "") + (s.session_time ? " " + s.session_time : "") + (s.type ? " - " + s.type : "")) +
            "</span></div><hr>";
        }).join("");
      }
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const signInBtn = document.getElementById("btn-signin");
  if (signInBtn) signInBtn.addEventListener("click", signInGoogle);

  const signOutBtn = document.getElementById("btn-signout");
  if (signOutBtn) signOutBtn.addEventListener("click", signOut);

  const requestForm = document.getElementById("request-form");
  if (requestForm) requestForm.addEventListener("submit", submitRequest);

  if (window.location.pathname.endsWith("member.html")) {
    loadMemberArea();
  }
})();
