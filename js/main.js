(function () {
  "use strict";

  var STORAGE_KEY = "geckonote_geckos";

  /* ---------------- 상태 ---------------- */
  var geckos = loadGeckos();
  var editingId = null;
  var currentPhotoDataUrl = "";
  var aiPhotoDataUrl = "";

  /* ---------------- DOM 참조 ---------------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  var navLinks = document.querySelectorAll("[data-nav]");
  var pages = document.querySelectorAll(".page");

  var geckoForm = document.getElementById("geckoForm");
  var formTitle = document.getElementById("formTitle");
  var submitBtn = document.getElementById("submitBtn");
  var cancelEditBtn = document.getElementById("cancelEditBtn");

  var fName = document.getElementById("fName");
  var fMorph = document.getElementById("fMorph");
  var fHatch = document.getElementById("fHatch");
  var fWeight = document.getElementById("fWeight");
  var fMemo = document.getElementById("fMemo");
  var fPhoto = document.getElementById("fPhoto");
  var photoPreview = document.getElementById("photoPreview");

  var geckoGrid = document.getElementById("geckoGrid");
  var emptyMsg = document.getElementById("emptyMsg");
  var listCount = document.getElementById("listCount");

  var statCount = document.getElementById("statCount");
  var statMorphs = document.getElementById("statMorphs");

  var aiPhotoInput = document.getElementById("aiPhoto");
  var aiPreview = document.getElementById("aiPreview");
  var geckoSelect = document.getElementById("geckoSelect");
  var analyzeBtn = document.getElementById("analyzeBtn");
  var analysisResult = document.getElementById("analysisResult");
  var resultSummary = document.getElementById("resultSummary");
  var resultList = document.getElementById("resultList");
  var analysisError = document.getElementById("analysisError");

  /* ---------------- 네비게이션 ---------------- */
  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      var target = link.getAttribute("data-nav");
      goToPage(target);
      mainNav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  function goToPage(target) {
    pages.forEach(function (page) {
      page.classList.toggle("active", page.id === "page-" + target);
    });
    document.querySelectorAll(".nav-link").forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("data-nav") === target);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (target === "analysis") {
      populateGeckoSelect();
    }
  }

  /* ---------------- 저장소 ---------------- */
  function loadGeckos() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveGeckos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(geckos));
  }

  function uid() {
    return "g" + Date.now() + Math.random().toString(16).slice(2, 8);
  }

  /* ---------------- 폼: 사진 미리보기 ---------------- */
  fPhoto.addEventListener("change", function () {
    var file = fPhoto.files[0];
    if (!file) return;
    readFileAsDataUrl(file, function (dataUrl) {
      currentPhotoDataUrl = dataUrl;
      photoPreview.innerHTML = "";
      var img = document.createElement("img");
      img.src = dataUrl;
      photoPreview.appendChild(img);
    });
  });

  function readFileAsDataUrl(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- 폼: 등록 / 수정 ---------------- */
  geckoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = fName.value.trim();
    if (!name) {
      fName.focus();
      return;
    }

    var data = {
      name: name,
      morph: fMorph.value.trim(),
      hatch: fHatch.value,
      weight: fWeight.value,
      memo: fMemo.value.trim(),
      photo: currentPhotoDataUrl
    };

    if (editingId) {
      var idx = geckos.findIndex(function (g) { return g.id === editingId; });
      if (idx !== -1) {
        data.photo = currentPhotoDataUrl || geckos[idx].photo;
        geckos[idx] = Object.assign({}, geckos[idx], data);
      }
      exitEditMode();
    } else {
      data.id = uid();
      geckos.unshift(data);
    }

    saveGeckos();
    resetForm();
    renderGeckoList();
    renderHomeStats();
  });

  cancelEditBtn.addEventListener("click", function () {
    exitEditMode();
    resetForm();
  });

  function resetForm() {
    geckoForm.reset();
    photoPreview.innerHTML = "";
    currentPhotoDataUrl = "";
  }

  function enterEditMode(gecko) {
    editingId = gecko.id;
    formTitle.textContent = "게코 정보 수정";
    submitBtn.textContent = "수정 완료";
    cancelEditBtn.hidden = false;

    fName.value = gecko.name || "";
    fMorph.value = gecko.morph || "";
    fHatch.value = gecko.hatch || "";
    fWeight.value = gecko.weight || "";
    fMemo.value = gecko.memo || "";
    currentPhotoDataUrl = gecko.photo || "";

    photoPreview.innerHTML = "";
    if (gecko.photo) {
      var img = document.createElement("img");
      img.src = gecko.photo;
      photoPreview.appendChild(img);
    }

    goToPage("gecko");
    geckoForm.scrollIntoView({ behavior: "smooth" });
  }

  function exitEditMode() {
    editingId = null;
    formTitle.textContent = "새 게코 등록";
    submitBtn.textContent = "등록하기";
    cancelEditBtn.hidden = true;
  }

  /* ---------------- 목록 렌더링 ---------------- */
  function renderGeckoList() {
    geckoGrid.innerHTML = "";

    if (geckos.length === 0) {
      emptyMsg.classList.add("show");
    } else {
      emptyMsg.classList.remove("show");
    }

    listCount.textContent = geckos.length + "마리";

    geckos.forEach(function (gecko) {
      geckoGrid.appendChild(buildGeckoCard(gecko));
    });
  }

  function buildGeckoCard(gecko) {
    var card = document.createElement("div");
    card.className = "gecko-card";

    var photoBox = document.createElement("div");
    photoBox.className = "gecko-card-photo";
    if (gecko.photo) {
      var img = document.createElement("img");
      img.src = gecko.photo;
      img.alt = gecko.name;
      photoBox.appendChild(img);
    } else {
      photoBox.textContent = "🦎";
    }
    card.appendChild(photoBox);

    var body = document.createElement("div");
    body.className = "gecko-card-body";

    var nameEl = document.createElement("h3");
    nameEl.className = "gecko-card-name";
    nameEl.textContent = gecko.name;
    body.appendChild(nameEl);

    if (gecko.morph) {
      var morphEl = document.createElement("span");
      morphEl.className = "gecko-card-morph";
      morphEl.textContent = gecko.morph;
      body.appendChild(morphEl);
    }

    if (gecko.hatch) {
      var hatchEl = document.createElement("p");
      hatchEl.className = "gecko-card-meta";
      hatchEl.textContent = "부화일: " + gecko.hatch;
      body.appendChild(hatchEl);
    }

    if (gecko.weight) {
      var weightEl = document.createElement("p");
      weightEl.className = "gecko-card-meta";
      weightEl.textContent = "무게: " + gecko.weight + "g";
      body.appendChild(weightEl);
    }

    if (gecko.memo) {
      var memoEl = document.createElement("p");
      memoEl.className = "gecko-card-memo";
      memoEl.textContent = gecko.memo;
      body.appendChild(memoEl);
    }

    var actions = document.createElement("div");
    actions.className = "gecko-card-actions";

    var editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", function () {
      enterEditMode(gecko);
    });

    var delBtn = document.createElement("button");
    delBtn.className = "btn-delete";
    delBtn.textContent = "삭제";
    delBtn.addEventListener("click", function () {
      if (confirm(gecko.name + " 게코 정보를 삭제할까요?")) {
        geckos = geckos.filter(function (g) { return g.id !== gecko.id; });
        saveGeckos();
        renderGeckoList();
        renderHomeStats();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  /* ---------------- 홈 통계 ---------------- */
  function renderHomeStats() {
    statCount.textContent = geckos.length;
    var morphSet = new Set(
      geckos
        .map(function (g) { return (g.morph || "").trim(); })
        .filter(function (m) { return m.length > 0; })
    );
    statMorphs.textContent = morphSet.size;
  }

  /* ---------------- 모프 AI 분석 ---------------- */
  aiPhotoInput.addEventListener("change", function () {
    var file = aiPhotoInput.files[0];
    if (!file) return;
    geckoSelect.value = "";
    readFileAsDataUrl(file, function (dataUrl) {
      setAiPhoto(dataUrl);
    });
  });

  geckoSelect.addEventListener("change", function () {
    var id = geckoSelect.value;
    if (!id) return;
    var gecko = geckos.find(function (g) { return g.id === id; });
    if (gecko && gecko.photo) {
      setAiPhoto(gecko.photo);
    } else {
      alert("선택한 게코에는 등록된 사진이 없어요.");
      geckoSelect.value = "";
    }
  });

  function setAiPhoto(dataUrl) {
    aiPhotoDataUrl = dataUrl;
    aiPreview.innerHTML = "";
    var img = document.createElement("img");
    img.src = dataUrl;
    aiPreview.appendChild(img);
    analyzeBtn.disabled = false;
    analysisResult.hidden = true;
    analysisError.hidden = true;
  }

  function populateGeckoSelect() {
    var current = geckoSelect.value;
    geckoSelect.innerHTML = '<option value="">직접 업로드</option>';
    geckos.forEach(function (g) {
      var opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name + (g.morph ? " (" + g.morph + ")" : "");
      if (!g.photo) opt.disabled = true;
      geckoSelect.appendChild(opt);
    });
    geckoSelect.value = current || "";
  }

  analyzeBtn.addEventListener("click", function () {
    if (!aiPhotoDataUrl) return;

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "분석 중...";
    analysisResult.hidden = true;
    analysisError.hidden = true;

    fetch("/api/analyze_morph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: aiPhotoDataUrl })
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.body || result.body.success !== true) {
          var message = (result.body && result.body.error) || "잠시 후 다시 시도해주세요";
          showAnalysisError(message);
          return;
        }
        renderAnalysisResult(result.body.result);
      })
      .catch(function () {
        showAnalysisError("잠시 후 다시 시도해주세요");
      })
      .finally(function () {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "분석하기";
      });
  });

  function showAnalysisError(message) {
    analysisError.textContent = message;
    analysisError.hidden = false;
  }

  function renderAnalysisResult(result) {
    var candidates = (result && result.candidates) || [];

    resultSummary.textContent = (result && result.summary) || "";
    resultSummary.hidden = !resultSummary.textContent;

    resultList.innerHTML = "";

    if (candidates.length === 0) {
      var empty = document.createElement("p");
      empty.className = "result-item-desc";
      empty.textContent = "가능성 있는 모프를 찾지 못했어요. 다른 사진으로 다시 시도해보세요.";
      resultList.appendChild(empty);
      analysisResult.hidden = false;
      return;
    }

    candidates.forEach(function (item) {
      var pct = Math.max(0, Math.min(100, Math.round(Number(item.confidence) || 0)));

      var wrap = document.createElement("div");
      wrap.className = "result-item";

      var top = document.createElement("div");
      top.className = "result-item-top";
      var nameSpan = document.createElement("span");
      nameSpan.textContent = item.name || "알 수 없음";
      var pctSpan = document.createElement("span");
      pctSpan.className = "pct";
      pctSpan.textContent = pct + "%";
      top.appendChild(nameSpan);
      top.appendChild(pctSpan);

      var track = document.createElement("div");
      track.className = "result-bar-track";
      var fill = document.createElement("div");
      fill.className = "result-bar-fill";
      track.appendChild(fill);

      var desc = document.createElement("p");
      desc.className = "result-item-desc";
      desc.textContent = item.description || "";

      wrap.appendChild(top);
      wrap.appendChild(track);
      wrap.appendChild(desc);
      resultList.appendChild(wrap);
    });

    analysisResult.hidden = false;

    requestAnimationFrame(function () {
      var fills = resultList.querySelectorAll(".result-bar-fill");
      fills.forEach(function (fill, i) {
        fill.style.width = Math.max(0, Math.min(100, Math.round(Number(candidates[i].confidence) || 0))) + "%";
      });
    });
  }

  /* ---------------- 초기화 ---------------- */
  renderGeckoList();
  renderHomeStats();
  populateGeckoSelect();
})();
