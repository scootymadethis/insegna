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

  // Anteprime degli esempi: scala l'iframe largo 390px alla finestra disponibile.
  var finestre = document.querySelectorAll(".esempio__finestra");
  if (finestre.length && "ResizeObserver" in window) {
    var ro = new ResizeObserver(function (voci) {
      voci.forEach(function (v) {
        var larghezza = v.contentRect.width;
        v.target.style.setProperty("--scala", (larghezza / 390).toFixed(4));
      });
    });
    finestre.forEach(function (f) { ro.observe(f); });
  }

  aggiorna("", null);
})();
