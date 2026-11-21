// Insegna — interazioni della landing. Nessun cookie, nessun dato salvato nel browser.
(function () {
  "use strict";

  var PREDEFINITO = "La tua attività";
  var bersagli = document.querySelectorAll("[data-nome]");
  var ingressi = document.querySelectorAll("[data-input-nome]");
  var nomeInsegna = document.querySelector(".insegna__nome");

  function dimensioneInsegna(testo) {
    if (!nomeInsegna) return;
    var n = testo.length;
    // Più lettere, corpo più piccolo: l'insegna deve restare leggibile su una riga o due.
    var vw = n <= 12 ? 8.4 : n <= 18 ? 6.6 : n <= 26 ? 5.2 : n <= 36 ? 4.2 : 3.4;
    var max = n <= 12 ? 5.4 : n <= 18 ? 4.6 : n <= 26 ? 3.8 : 3.1;
    nomeInsegna.style.setProperty("--nome-size", "clamp(1.6rem, " + vw + "vw, " + max + "rem)");
  }

  function aggiorna(valore, origine) {
    var testo = (valore || "").replace(/\s+/g, " ").trim();
    var mostrato = testo || PREDEFINITO;
    bersagli.forEach(function (el) { el.textContent = mostrato; });
    ingressi.forEach(function (el) { if (el !== origine && el.value !== testo) el.value = testo; });
    dimensioneInsegna(mostrato);
  }

  ingressi.forEach(function (el) {
    el.addEventListener("input", function () { aggiorna(el.value, el); });
  });

  // Il mini-modulo dell'hero porta al modulo completo, con il nome già scritto.
  var prova = document.querySelector("[data-prova]");
  if (prova) {
    prova.addEventListener("submit", function (e) {
      e.preventDefault();
      var richiesta = document.getElementById("richiesta");
      var nome = document.getElementById("m-nome");
      var categoria = document.getElementById("m-categoria");
      if (richiesta) richiesta.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      var prossimo = nome && nome.value ? categoria : nome;
      if (prossimo) setTimeout(function () { prossimo.focus({ preventScroll: true }); }, 450);
    });
  }

  // Provenienza della visita (?da=subito, ?da=facebook…) per misurare i canali senza cookie.
  var campoProvenienza = document.querySelector("[data-provenienza]");
  if (campoProvenienza) {
    try {
      var da = new URLSearchParams(location.search).get("da");
      if (da) campoProvenienza.value = da.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) || "diretto";
    } catch (err) { /* browser molto vecchi: resta "diretto" */ }
  }

  // Anteprime degli esempi: l'iframe è un telefono largo 390px, ridotto per riempire
  // esattamente la cornice (larghezza e altezza), qualunque sia la sua dimensione.
  var finestre = document.querySelectorAll(".esempio__finestra");
  function adatta(f) {
    var iframe = f.querySelector("iframe");
    if (!iframe || !f.clientWidth) return;
    var scala = f.clientWidth / 390;
    iframe.style.transform = "scale(" + scala.toFixed(4) + ")";
    iframe.style.height = Math.ceil(f.clientHeight / scala) + "px";
  }
  function adattaTutte() { finestre.forEach(adatta); }
  if (finestre.length) {
    adattaTutte();
    window.addEventListener("load", adattaTutte);
    window.addEventListener("resize", adattaTutte);
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(adattaTutte);
      finestre.forEach(function (f) { ro.observe(f); });
    }
  }

  aggiorna("", null);
})();
