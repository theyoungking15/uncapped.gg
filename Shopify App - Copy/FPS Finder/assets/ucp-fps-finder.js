(() => {
  const ROOT_SELECTOR = "[data-ucp-fps-finder]";
  const TIER_ORDER = ["tier_1", "tier_2", "tier_3"];
  const ALTERNATE_MIN_FPS_GAIN_RATIO = 0.1;
  const ALTERNATE_MAX_PRICE_JUMP_RATIO = 0.35;
  const UPGRADE_PATH_MAX_PRICE_JUMP_RATIO = 0.5;
  const DEFAULT_TOP_RECOMMENDATION_SLOTS = ["best_budget", "best_value", "better_upgrade_path"];
  const RESOLUTION_META = {
    "1080p": { label: "1080p" },
    "1440p": { label: "1440p" },
    "4k": { label: "4K" }
  };
  const PRESET_ORDER = ["low", "medium", "high"];
  const PRESET_META = {
    low: { label: "Low" },
    medium: { label: "Medium" },
    high: { label: "High" }
  };
  const COMPARE_BETA_MODAL_MODES = {
    OFF: "off",
    EVERY_PAGE_LOAD: "every_page_load",
    ONCE_PER_SESSION: "once_per_session",
    ONCE_PER_DEVICE: "once_per_device"
  };
  const COMPARE_BETA_MODAL_STORAGE_KEYS = {
    session: "ucp-fps-finder:compare-beta-modal:session",
    device: "ucp-fps-finder:compare-beta-modal:device"
  };
  const LEGACY_COMPARE_BETA_MODAL_COPY = {
    title: "Component Compare is in beta",
    body: "Use this compare view as a directional guide only. It shows rough CPU and GPU hierarchy plus ballpark FPS gaps. Actual results vary with the full build, cooling, drivers, game patches, scenes, and settings, so do not treat these compare bars as guaranteed real-world FPS."
  };
  const DEFAULT_COMPARE_BETA_MODAL_COPY = {
    title: "FPS Finder is in beta",
    body: "Use FPS Finder as a directional guide for CPU and GPU hierarchy plus estimated FPS gaps. Actual results vary with the full build, cooling, drivers, game patches, scenes, and settings, so do not treat these results as guaranteed real-world FPS.",
    buttonLabel: "Got it"
  };

  const gameIndexCache = new Map();
  const gamePayloadCache = new Map();
  const pairPayloadCache = new Map();
  const collectionCache = new Map();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAll);
  } else {
    bootAll();
  }

  function bootAll() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(initRoot);
  }

  function initRoot(root) {
    if (!root || root.__ucpFpsFinderReady) return;
    root.__ucpFpsFinderReady = true;

    const cfg = readConfig(root);
    if (cfg.finderMode === "component_centric") {
      initComponentCentricRoot(root, cfg);
      return;
    }

    const ui = {
      selectedGame: root.querySelector("#ucp-fps-finder-selected-game"),
      gameSelect: root.querySelector("#ucp-fps-finder-game"),
      resolutions: root.querySelector("#ucp-fps-finder-resolutions"),
      presets: root.querySelector("#ucp-fps-finder-presets"),
      note: root.querySelector("#ucp-fps-finder-note"),
      status: root.querySelector("#ucp-fps-finder-status"),
      recommendations: root.querySelector("#ucp-fps-finder-recommendations"),
      results: root.querySelector("#ucp-fps-finder-results"),
      compare: root.querySelector("#ucp-fps-finder-compare")
    };

    const state = {
      cfg,
      games: [],
      gamesByKey: new Map(),
      gameBenchmarksByKey: new Map(),
      cpuIndex: new Map(),
      gpuIndex: new Map(),
      selectedGame: "",
      selectedResolution: "",
      selectedPreset: "",
      compare: {
        active: false,
        baselineComboKey: "",
        cpuBenchHandle: "",
        gpuBenchHandle: ""
      },
      activeGameRequest: 0
    };

    ui.gameSelect?.addEventListener("change", async () => {
      state.selectedGame = normalizeToken(ui.gameSelect.value);
      resetCompareState(state);
      syncResolution(state);
      syncPreset(state, true);
      try {
        await loadSelectedGame(state, ui);
      } catch (error) {
        handleRuntimeError(state, ui, error);
      }
    });

    ui.resolutions?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-resolution]");
      if (!button) return;

      const nextResolution = normalizeResolutionKey(button.getAttribute("data-resolution"));
      if (!nextResolution) return;

      state.selectedResolution = nextResolution;
      resetCompareState(state);
      render(state, ui);
    });

    ui.presets?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-preset]");
      if (!button) return;

      const nextPreset = normalizePresetKey(button.getAttribute("data-preset"));
      if (!nextPreset) return;

      state.selectedPreset = nextPreset;
      resetCompareState(state);
      render(state, ui);
    });

    root.addEventListener("click", (event) => {
      const compareTrigger = event.target.closest("[data-compare-combo]");
      if (compareTrigger) {
        state.compare.active = true;
        state.compare.baselineComboKey = stringOrEmpty(compareTrigger.getAttribute("data-compare-combo"));
        state.compare.cpuBenchHandle = normalizeToken(compareTrigger.getAttribute("data-compare-cpu"));
        state.compare.gpuBenchHandle = normalizeToken(compareTrigger.getAttribute("data-compare-gpu"));
        render(state, ui);
        return;
      }

      const compareClose = event.target.closest("[data-compare-close]");
      if (compareClose) {
        resetCompareState(state);
        render(state, ui);
        return;
      }

      const compareReset = event.target.closest("[data-compare-reset]");
      if (compareReset) {
        state.compare.cpuBenchHandle = normalizeToken(compareReset.getAttribute("data-compare-cpu"));
        state.compare.gpuBenchHandle = normalizeToken(compareReset.getAttribute("data-compare-gpu"));
        render(state, ui);
      }
    });

    root.addEventListener("change", (event) => {
      const cpuSelect = event.target.closest("[data-compare-cpu]");
      if (cpuSelect) {
        state.compare.cpuBenchHandle = normalizeToken(cpuSelect.value);
        render(state, ui);
        return;
      }

      const gpuSelect = event.target.closest("[data-compare-gpu]");
      if (gpuSelect) {
        state.compare.gpuBenchHandle = normalizeToken(gpuSelect.value);
        render(state, ui);
      }
    });

    loadInitialData(state, ui).catch((error) => {
      handleRuntimeError(state, ui, error);
    });
  }

  function initComponentCentricRoot(root, cfg) {
    const ui = {
      viewToggleButtons: Array.from(root.querySelectorAll("[data-component-view-toggle]")),
      browseShell: root.querySelector("#ucp-fps-finder-component-browse"),
      compareShell: root.querySelector("#ucp-fps-finder-component-compare"),
      compareBetaModal: root.querySelector("#ucp-fps-finder-component-compare-beta-modal"),
      cpuSelect: root.querySelector("#ucp-fps-finder-component-cpu"),
      gpuSelect: root.querySelector("#ucp-fps-finder-component-gpu"),
      resolutions: root.querySelector("#ucp-fps-finder-resolutions"),
      presets: root.querySelector("#ucp-fps-finder-presets"),
      stage: root.querySelector("#ucp-fps-finder-component-stage"),
      picker: root.querySelector("#ucp-fps-finder-component-picker"),
      note: root.querySelector("#ucp-fps-finder-note"),
      status: root.querySelector("#ucp-fps-finder-status"),
      results: root.querySelector("#ucp-fps-finder-results"),
      recommendations: null,
      compare: null
    };

    const state = {
      cfg,
      games: [],
      gamesByKey: new Map(),
      cpuIndex: new Map(),
      gpuIndex: new Map(),
      cpuOptions: [],
      gpuOptions: [],
      cpuOptionsById: new Map(),
      gpuOptionsById: new Map(),
      selectedCpuId: "",
      selectedGpuId: "",
      selectedResolution: "",
      selectedPreset: "medium",
      activeGame: "",
      pairBenchmarks: [],
      loadedPairCpuId: "",
      loadedPairGpuId: "",
      activePairRequest: 0,
      compare: createComponentCompareState(),
      compareBetaModalOpen: shouldShowComponentCompareBetaModal(cfg)
    };

    renderComponentCompareBetaModal(state, ui);

    ui.cpuSelect?.addEventListener("change", async () => {
      state.selectedCpuId = stringOrEmpty(ui.cpuSelect.value);
      try {
        await loadSelectedPair(state, ui);
      } catch (error) {
        handleRuntimeError(state, ui, error);
      }
    });

    ui.gpuSelect?.addEventListener("change", async () => {
      state.selectedGpuId = stringOrEmpty(ui.gpuSelect.value);
      try {
        await loadSelectedPair(state, ui);
      } catch (error) {
        handleRuntimeError(state, ui, error);
      }
    });

    ui.resolutions?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-resolution]");
      if (!button) return;

      const nextResolution = normalizeResolutionKey(button.getAttribute("data-resolution"));
      if (!nextResolution) return;

      state.selectedResolution = nextResolution;
      renderComponentCentric(state, ui);
    });

    ui.presets?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-preset]");
      if (!button) return;

      const nextPreset = normalizePresetKey(button.getAttribute("data-preset"));
      if (!nextPreset) return;

      state.selectedPreset = nextPreset;
      renderComponentCentric(state, ui);
    });

    root.addEventListener("click", (event) => {
      const compareBetaModalDismiss = event.target.closest("[data-component-compare-beta-modal-dismiss]");
      if (compareBetaModalDismiss) {
        dismissComponentCompareBetaModal(state, ui);
        return;
      }

      if (state.compareBetaModalOpen && event.target instanceof Element && event.target.matches("[data-component-compare-beta-modal]")) {
        dismissComponentCompareBetaModal(state, ui);
        return;
      }

      const viewToggle = event.target.closest("[data-component-view-toggle]");
      if (viewToggle) {
        const nextMode = stringOrEmpty(viewToggle.getAttribute("data-component-view-toggle"));
        if (nextMode === "single") {
          if (!state.compare.open) return;
          closeComponentCompareMode(state, ui).catch((error) => {
            handleRuntimeError(state, ui, error);
          });
          return;
        }

        if (nextMode === "compare" && !state.compare.open) {
          openComponentCompareMode(state, ui).catch((error) => {
            handleRuntimeError(state, ui, error);
          });
        }
        return;
      }

      const compareGamesScroll = event.target.closest("[data-component-compare-scroll]");
      if (compareGamesScroll) {
        const direction = stringOrEmpty(compareGamesScroll.getAttribute("data-component-compare-scroll"));
        const compareGamesList = root.querySelector("[data-component-compare-games-list]");
        if (compareGamesList && typeof compareGamesList.scrollBy === "function") {
          compareGamesList.scrollBy({
            left: direction === "prev" ? -320 : 320,
            behavior: "smooth"
          });
        }
        return;
      }

      const compareResolution = event.target.closest("[data-component-compare-resolution]");
      if (compareResolution) {
        const nextResolution = normalizeResolutionKey(compareResolution.getAttribute("data-component-compare-resolution"));
        if (!nextResolution) return;
        state.compare.selectedResolution = nextResolution;
        renderComponentCentric(state, ui);
        return;
      }

      const comparePreset = event.target.closest("[data-component-compare-preset]");
      if (comparePreset) {
        const nextPreset = normalizePresetKey(comparePreset.getAttribute("data-component-compare-preset"));
        if (!nextPreset) return;
        state.compare.selectedPreset = nextPreset;
        renderComponentCentric(state, ui);
        return;
      }

      const compareGameToggle = event.target.closest("[data-component-compare-game]");
      if (compareGameToggle) {
        toggleComponentCompareGame(state, normalizeToken(compareGameToggle.getAttribute("data-component-compare-game")));
        renderComponentCentric(state, ui);
        return;
      }

      const gameButton = event.target.closest("[data-component-game]");
      if (gameButton) {
        const nextGame = normalizeToken(gameButton.getAttribute("data-component-game"));
        if (!nextGame || !state.gamesByKey.has(nextGame)) return;
        state.activeGame = nextGame;
        renderComponentCentric(state, ui);
        return;
      }

      const navButton = event.target.closest("[data-component-nav]");
      if (navButton) {
        const direction = stringOrEmpty(navButton.getAttribute("data-component-nav"));
        stepComponentActiveGame(state, direction);
        renderComponentCentric(state, ui);
      }
    });

    root.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !state.compareBetaModalOpen) return;
      event.preventDefault();
      dismissComponentCompareBetaModal(state, ui);
    });

    root.addEventListener("scroll", (event) => {
      const compareGamesList = event.target?.closest?.("[data-component-compare-games-list]");
      if (!compareGamesList) return;
      state.compare.gamesScrollLeft = compareGamesList.scrollLeft;
    }, true);

    root.addEventListener("change", (event) => {
      const compareCpuSelect = event.target.closest("[data-component-compare-cpu]");
      if (compareCpuSelect) {
        const pairKey = normalizeComponentComparePairKey(compareCpuSelect.getAttribute("data-component-compare-pair"));
        if (!pairKey) return;
        state.compare[pairKey].selectedCpuId = stringOrEmpty(compareCpuSelect.value);
        loadComponentComparePair(state, ui, pairKey).catch((error) => {
          handleComponentCompareError(state, ui, error, pairKey);
        });
        return;
      }

      const compareGpuSelect = event.target.closest("[data-component-compare-gpu]");
      if (compareGpuSelect) {
        const pairKey = normalizeComponentComparePairKey(compareGpuSelect.getAttribute("data-component-compare-pair"));
        if (!pairKey) return;
        state.compare[pairKey].selectedGpuId = stringOrEmpty(compareGpuSelect.value);
        loadComponentComparePair(state, ui, pairKey).catch((error) => {
          handleComponentCompareError(state, ui, error, pairKey);
        });
      }
    });

    loadInitialComponentData(state, ui).catch((error) => {
      handleRuntimeError(state, ui, error);
    });
  }

  function createComponentComparePairState() {
    return {
      selectedCpuId: "",
      selectedGpuId: "",
      pairBenchmarks: [],
      activeRequest: 0,
      loading: false,
      error: ""
    };
  }

  function createComponentCompareState() {
    return {
      initialized: false,
      open: false,
      gamesScrollLeft: 0,
      selectedGameKeys: [],
      selectedResolution: "",
      selectedPreset: "medium",
      pairA: createComponentComparePairState(),
      pairB: createComponentComparePairState()
    };
  }

  function normalizeComponentComparePairKey(value) {
    const normalized = normalizeToken(value);
    if (normalized === "a") return "pairA";
    if (normalized === "b") return "pairB";
    return "";
  }

  function resetComponentComparePairState(pairState, resetSelection = false) {
    if (!pairState) return;
    if (resetSelection) {
      pairState.selectedCpuId = "";
      pairState.selectedGpuId = "";
    }
    pairState.pairBenchmarks = [];
    pairState.activeRequest = 0;
    pairState.loading = false;
    pairState.error = "";
  }

  async function loadInitialData(state, ui) {
    const configError = validateConfig(state.cfg);
    if (configError) throw new Error(configError);

    setStatus(ui, "Loading games...", "loading");

    const [indexJson, cpuProducts, gpuProducts] = await Promise.all([
      fetchGameIndex(state.cfg.dataEndpoint),
      fetchCollectionProducts(state.cfg.endpoints.cpu),
      fetchCollectionProducts(state.cfg.endpoints.gpu)
    ]);

    state.games = normalizeGames(indexJson.games);
    state.gamesByKey = new Map(state.games.map((game) => [game.key, game]));
    state.cpuIndex = buildProductCatalog(cpuProducts, "cpu");
    state.gpuIndex = buildProductCatalog(gpuProducts, "gpu");

    renderGameOptions(state, ui);

    if (!state.games.length) {
      setStatus(
        ui,
        state.cfg.copy.emptyResults || "No enabled FPS Finder games are configured yet.",
        "empty"
      );
      ui.results.innerHTML = "";
      ui.resolutions.innerHTML = "";
      if (ui.presets) ui.presets.innerHTML = "";
      if (ui.compare) {
        ui.compare.hidden = true;
        ui.compare.innerHTML = "";
      }
      if (ui.recommendations) {
        ui.recommendations.hidden = true;
        ui.recommendations.innerHTML = "";
      }
      ui.selectedGame.hidden = true;
      ui.note.hidden = true;
      return;
    }

    state.selectedGame = state.games[0].key;
    syncResolution(state);
    syncPreset(state, true);
    await loadSelectedGame(state, ui);
  }

  async function loadInitialComponentData(state, ui) {
    const configError = validateComponentConfig(state.cfg);
    if (configError) throw new Error(configError);

    setStatus(ui, "Loading FPS Finder catalog...", "loading");

    const [indexJson, cpuProducts, gpuProducts] = await Promise.all([
      fetchGameIndex(state.cfg.dataEndpoint),
      fetchCollectionProducts(state.cfg.endpoints.cpu),
      fetchCollectionProducts(state.cfg.endpoints.gpu)
    ]);

    state.games = normalizeGames(indexJson.games);
    state.gamesByKey = new Map(state.games.map((game) => [game.key, game]));
    state.cpuIndex = buildProductCatalog(cpuProducts, "cpu");
    state.gpuIndex = buildProductCatalog(gpuProducts, "gpu");
    state.cpuOptions = buildCatalogSelectOptions(state.cpuIndex);
    state.gpuOptions = buildCatalogSelectOptions(state.gpuIndex);
    state.cpuOptionsById = new Map(state.cpuOptions.map((option) => [option.value, option.entry]));
    state.gpuOptionsById = new Map(state.gpuOptions.map((option) => [option.value, option.entry]));
    state.activeGame = state.games[0]?.key || "";
    syncComponentResolution(state);
    state.selectedPreset = "medium";

    renderCatalogSelect(ui.cpuSelect, state.cpuOptions, state.selectedCpuId, "Select a CPU");
    renderCatalogSelect(ui.gpuSelect, state.gpuOptions, state.selectedGpuId, "Select a GPU");
    await openComponentCompareMode(state, ui);
  }

  function validateConfig(cfg) {
    if (!cfg.dataEndpoint) return "Missing FPS Finder game index endpoint.";
    if (!cfg.gameDataEndpoint) return "Missing FPS Finder game data endpoint.";
    if (!cfg.endpoints?.cpu) return "Missing CPU collection endpoint.";
    if (!cfg.endpoints?.gpu) return "Missing GPU collection endpoint.";
    return "";
  }

  function validateComponentConfig(cfg) {
    if (!cfg.dataEndpoint) return "Missing FPS Finder game index endpoint.";
    if (!cfg.pairDataEndpoint) return "Missing FPS Finder pair data endpoint.";
    if (!cfg.endpoints?.cpu) return "Missing CPU collection endpoint.";
    if (!cfg.endpoints?.gpu) return "Missing GPU collection endpoint.";
    return "";
  }

  function readConfig(root) {
    const el = root.querySelector("#ucp-fps-finder-config");
    const raw = el ? JSON.parse(el.textContent || "{}") : {};

    return {
      finderMode: normalizeFinderMode(raw.finder_mode),
      dataEndpoint: stringOrEmpty(raw.data_endpoint),
      gameDataEndpoint: stringOrEmpty(raw.game_data_endpoint),
      pairDataEndpoint: stringOrEmpty(raw.pair_data_endpoint),
      builderPageUrl: stringOrEmpty(raw.builder_page_url),
      disableCtaWhenUnavailable: raw.disable_cta_when_unavailable === true,
      awaitingTileLogoUrl: stringOrEmpty(raw.awaiting_tile_logo_url),
      topRecommendationSlots: normalizeTopRecommendationSlots([
        raw.top_card_1_lane,
        raw.top_card_2_lane,
        raw.top_card_3_lane
      ]),
      thresholds: {
        bestStartingMinFpsGainRatio: percentSettingToRatio(raw.best_starting_min_fps_gain_percent, 10),
        bestStartingMaxPriceIncreaseRatio: percentSettingToRatio(raw.best_starting_max_price_increase_percent, 20)
      },
      endpoints: {
        cpu: stringOrEmpty(raw?.endpoints?.cpu),
        gpu: stringOrEmpty(raw?.endpoints?.gpu)
      },
      compareBetaModal: {
        mode: normalizeCompareBetaModalMode(raw?.compare_beta_modal?.mode),
        title: resolveDefaultSetting(
          raw?.compare_beta_modal?.title,
          DEFAULT_COMPARE_BETA_MODAL_COPY.title,
          LEGACY_COMPARE_BETA_MODAL_COPY.title
        ),
        body: resolveDefaultSetting(
          raw?.compare_beta_modal?.body,
          DEFAULT_COMPARE_BETA_MODAL_COPY.body,
          LEGACY_COMPARE_BETA_MODAL_COPY.body
        ),
        buttonLabel: stringOrEmpty(raw?.compare_beta_modal?.button_label) || DEFAULT_COMPARE_BETA_MODAL_COPY.buttonLabel
      },
      copy: {
        emptyResults: stringOrEmpty(raw?.copy?.empty_results),
        loadError: stringOrEmpty(raw?.copy?.load_error)
      }
    };
  }

  function shouldShowComponentCompareBetaModal(cfg) {
    const mode = normalizeCompareBetaModalMode(cfg?.compareBetaModal?.mode);
    if (mode === COMPARE_BETA_MODAL_MODES.OFF) return false;
    if (mode === COMPARE_BETA_MODAL_MODES.EVERY_PAGE_LOAD) return true;
    if (mode === COMPARE_BETA_MODAL_MODES.ONCE_PER_SESSION) {
      return !readStorageFlag(window.sessionStorage, COMPARE_BETA_MODAL_STORAGE_KEYS.session);
    }
    if (mode === COMPARE_BETA_MODAL_MODES.ONCE_PER_DEVICE) {
      return !readStorageFlag(window.localStorage, COMPARE_BETA_MODAL_STORAGE_KEYS.device);
    }
    return true;
  }

  function dismissComponentCompareBetaModal(state, ui) {
    state.compareBetaModalOpen = false;
    recordComponentCompareBetaModalDismissal(state.cfg);
    renderComponentCompareBetaModal(state, ui);
  }

  function recordComponentCompareBetaModalDismissal(cfg) {
    const mode = normalizeCompareBetaModalMode(cfg?.compareBetaModal?.mode);
    if (mode === COMPARE_BETA_MODAL_MODES.ONCE_PER_SESSION) {
      writeStorageFlag(window.sessionStorage, COMPARE_BETA_MODAL_STORAGE_KEYS.session);
      return;
    }
    if (mode === COMPARE_BETA_MODAL_MODES.ONCE_PER_DEVICE) {
      writeStorageFlag(window.localStorage, COMPARE_BETA_MODAL_STORAGE_KEYS.device);
    }
  }

  function renderComponentCompareBetaModal(state, ui) {
    if (!ui.compareBetaModal) return;

    if (!state.compareBetaModalOpen) {
      ui.compareBetaModal.hidden = true;
      ui.compareBetaModal.innerHTML = "";
      return;
    }

    ui.compareBetaModal.hidden = false;
    ui.compareBetaModal.innerHTML = `
      <div class="ucp-fpsf__component-compare-beta-modal-layer" data-component-compare-beta-modal>
        <div class="ucp-fpsf__component-compare-beta-modal" role="dialog" aria-modal="true" aria-label="${escapeAttribute(state.cfg.compareBetaModal.title)}">
          <p class="ucp-fpsf__component-compare-beta-modal-kicker">FPS Finder beta guide</p>
          <h3 class="ucp-fpsf__component-compare-beta-modal-title">${escapeHtml(state.cfg.compareBetaModal.title)}</h3>
          <div class="ucp-fpsf__component-compare-beta-modal-body">
            ${renderComponentCompareBetaModalBodyMarkup(state.cfg.compareBetaModal.body)}
          </div>
          <div class="ucp-fpsf__component-compare-beta-modal-actions">
            <button type="button" class="ucp-fpsf__compare-action ucp-fpsf__component-compare-beta-modal-button" data-component-compare-beta-modal-dismiss>${escapeHtml(state.cfg.compareBetaModal.buttonLabel)}</button>
          </div>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      const dismissButton = ui.compareBetaModal.querySelector("[data-component-compare-beta-modal-dismiss]");
      dismissButton?.focus();
    });
  }

  function renderComponentCompareBetaModalBodyMarkup(body) {
    return stringOrEmpty(body)
      .split(/\n{2,}/)
      .map((paragraph) => stringOrEmpty(paragraph))
      .filter(Boolean)
      .map((paragraph) => `<p class="ucp-fpsf__component-compare-beta-modal-text">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function readStorageFlag(storage, key) {
    try {
      return storage?.getItem(key) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeStorageFlag(storage, key) {
    try {
      storage?.setItem(key, "1");
    } catch (error) {
      // Storage access can fail in privacy-restricted contexts; treat it as non-fatal.
    }
  }

  async function loadSelectedGame(state, ui) {
    const game = state.gamesByKey.get(state.selectedGame);
    if (!game) {
      render(state, ui);
      return;
    }

    const requestId = ++state.activeGameRequest;
    renderSelectedGame(game, ui);
    renderResolutions(game, state, ui);
    renderNotes(game, state, ui);
    setStatus(ui, `Loading ${game.name} recommendations...`, "loading");
    ui.results.innerHTML = "";

    await ensureGameBenchmarks(state, game.key);
    if (requestId !== state.activeGameRequest) return;

    render(state, ui);
  }

  async function fetchGameIndex(endpoint) {
    const cacheKey = String(endpoint || "");
    if (gameIndexCache.has(cacheKey)) return gameIndexCache.get(cacheKey);

    const promise = (async () => {
      const response = await fetch(new URL(cacheKey, window.location.origin).toString(), {
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error(`FPS Finder game index request failed with ${response.status}.`);
      }

      return response.json();
    })();

    gameIndexCache.set(cacheKey, promise);
    return promise;
  }

  async function ensureGameBenchmarks(state, gameKey) {
    const normalizedKey = normalizeToken(gameKey);
    if (!normalizedKey) return [];
    if (state.gameBenchmarksByKey.has(normalizedKey)) {
      return state.gameBenchmarksByKey.get(normalizedKey);
    }

    const cacheKey = [state.cfg.gameDataEndpoint, normalizedKey].join("|");
    if (gamePayloadCache.has(cacheKey)) {
      const rows = await gamePayloadCache.get(cacheKey);
      state.gameBenchmarksByKey.set(normalizedKey, rows);
      return rows;
    }

    const promise = (async () => {
      const rows = normalizeBenchmarks(await fetchGamePayload(state.cfg.gameDataEndpoint, normalizedKey));
      state.gameBenchmarksByKey.set(normalizedKey, rows);
      return rows;
    })();

    gamePayloadCache.set(cacheKey, promise);
    return promise;
  }

  async function fetchGamePayload(baseEndpoint, gameKey) {
    const benchmarks = [];
    const seenBenchmarkKeys = new Set();
    const seenUrls = new Set();
    let guard = 0;
    let nextUrl = buildGamePayloadUrl(baseEndpoint, gameKey);

    while (nextUrl) {
      guard += 1;
      if (guard > 80) {
        throw new Error("FPS Finder game payload pagination exceeded the safety limit.");
      }

      const absoluteUrl = new URL(nextUrl, window.location.origin).toString();
      if (seenUrls.has(absoluteUrl)) break;
      seenUrls.add(absoluteUrl);

      const response = await fetch(absoluteUrl, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(`FPS Finder game payload request failed with ${response.status}.`);
      }

      const json = await response.json();
      if (Array.isArray(json.benchmarks)) {
        for (const row of json.benchmarks) {
          const dedupeKey =
            stringOrEmpty(row?.key) ||
            [
              stringOrEmpty(row?.game_handle),
              stringOrEmpty(row?.resolution),
              stringOrEmpty(row?.preset),
              stringOrEmpty(row?.cpu_bench_handle),
              stringOrEmpty(row?.gpu_bench_handle),
              stringOrEmpty(row?.avg)
            ].join("|");

          if (!dedupeKey || seenBenchmarkKeys.has(dedupeKey)) continue;
          seenBenchmarkKeys.add(dedupeKey);
          benchmarks.push(row);
        }
      }

      const nextCursorUrl = stringOrEmpty(json.next_url);
      if (nextCursorUrl) {
        nextUrl = nextCursorUrl;
        continue;
      }

      const nextPage = Number(json.next_page || 0);
      if (!nextPage) break;

      const fallbackUrl = new URL(buildGamePayloadUrl(baseEndpoint, gameKey), window.location.origin);
      fallbackUrl.searchParams.set("page", String(nextPage));
      nextUrl = fallbackUrl.toString();
    }

    return benchmarks;
  }

  function buildGamePayloadUrl(baseEndpoint, gameKey) {
    const url = new URL(baseEndpoint, window.location.origin);
    url.searchParams.set("game", String(gameKey));
    return url.toString();
  }

  async function fetchPairPayload(baseEndpoint, cpuBenchHandle, gpuBenchHandle) {
    const cacheKey = [baseEndpoint, cpuBenchHandle, gpuBenchHandle].join("|");
    if (pairPayloadCache.has(cacheKey)) return pairPayloadCache.get(cacheKey);

    const promise = (async () => {
      const benchmarks = [];
      const seenBenchmarkKeys = new Set();
      const seenUrls = new Set();
      let guard = 0;
      let nextUrl = buildPairPayloadUrl(baseEndpoint, cpuBenchHandle, gpuBenchHandle);

      while (nextUrl) {
        guard += 1;
        if (guard > 80) {
          throw new Error("FPS Finder pair payload pagination exceeded the safety limit.");
        }

        const absoluteUrl = new URL(nextUrl, window.location.origin).toString();
        if (seenUrls.has(absoluteUrl)) break;
        seenUrls.add(absoluteUrl);

        const response = await fetch(absoluteUrl, { credentials: "same-origin" });
        if (!response.ok) {
          throw new Error(`FPS Finder pair payload request failed with ${response.status}.`);
        }

        const json = await response.json();
        if (Array.isArray(json.benchmarks)) {
          for (const row of json.benchmarks) {
            const dedupeKey =
              stringOrEmpty(row?.key) ||
              [
                stringOrEmpty(row?.game_handle),
                stringOrEmpty(row?.resolution),
                stringOrEmpty(row?.preset),
                stringOrEmpty(row?.cpu_bench_handle),
                stringOrEmpty(row?.gpu_bench_handle),
                stringOrEmpty(row?.avg)
              ].join("|");

            if (!dedupeKey || seenBenchmarkKeys.has(dedupeKey)) continue;
            seenBenchmarkKeys.add(dedupeKey);
            benchmarks.push(row);
          }
        }

        const nextCursorUrl = stringOrEmpty(json.next_url);
        if (nextCursorUrl) {
          nextUrl = nextCursorUrl;
          continue;
        }

        const nextPage = Number(json.next_page || 0);
        if (!nextPage) break;

        const fallbackUrl = new URL(buildPairPayloadUrl(baseEndpoint, cpuBenchHandle, gpuBenchHandle), window.location.origin);
        fallbackUrl.searchParams.set("page", String(nextPage));
        nextUrl = fallbackUrl.toString();
      }

      return benchmarks;
    })();

    pairPayloadCache.set(cacheKey, promise);
    return promise;
  }

  function buildPairPayloadUrl(baseEndpoint, cpuBenchHandle, gpuBenchHandle) {
    const url = new URL(baseEndpoint, window.location.origin);
    url.searchParams.set("cpu_bench", String(cpuBenchHandle));
    url.searchParams.set("gpu_bench", String(gpuBenchHandle));
    return url.toString();
  }

  async function fetchCollectionProducts(endpoint) {
    const cacheKey = String(endpoint || "");
    if (collectionCache.has(cacheKey)) return collectionCache.get(cacheKey);

    const promise = (async () => {
      const products = [];
      let page = 1;
      let guard = 0;

      while (true) {
        guard += 1;
        if (guard > 80) throw new Error("Collection pagination exceeded the safety limit.");

        const url = new URL(cacheKey, window.location.origin);
        url.searchParams.set("page", String(page));

        const response = await fetch(url.toString(), { credentials: "same-origin" });
        if (!response.ok) {
          throw new Error(`Collection request failed with ${response.status}.`);
        }

        const json = await response.json();
        if (Array.isArray(json.products)) {
          products.push(...json.products);
        }

        const nextPage = Number(json.next_page || 0);
        if (!nextPage || nextPage <= page) break;
        page = nextPage;
      }

      return products;
    })();

    collectionCache.set(cacheKey, promise);
    return promise;
  }

  function buildCatalogSelectOptions(catalog) {
    const options = [];
    const seenVariantIds = new Set();

    for (const entries of catalog.values()) {
      for (const entry of entries) {
        const variantId = stringOrEmpty(entry?.variant?.id);
        if (!variantId || seenVariantIds.has(variantId)) continue;
        seenVariantIds.add(variantId);
        options.push({
          value: variantId,
          label: `${entry.title} | ${formatMoney(entry?.variant?.price)}`,
          entry
        });
      }
    }

    return options.sort((left, right) => compareVariantPrice(left?.entry?.variant, right?.entry?.variant));
  }

  function renderCatalogSelect(select, options, selectedValue, placeholder) {
    if (!select) return;
    select.innerHTML = renderCatalogSelectOptionsMarkup(options, selectedValue, placeholder);
    select.value = selectedValue || "";
  }

  function renderCatalogSelectOptionsMarkup(options, selectedValue, placeholder) {
    const optionMarkup = (Array.isArray(options) ? options : [])
      .map((option) => `<option value="${escapeAttribute(option.value)}"${option.value === selectedValue ? " selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("");

    return `<option value="">${escapeHtml(placeholder || "Select an option")}</option>${optionMarkup}`;
  }

  function normalizeGames(rawGames) {
    return (Array.isArray(rawGames) ? rawGames : [])
      .map((raw) => {
        const key = normalizeToken(raw?.game_handle || raw?.handle || raw?.key);
        if (!key) return null;

        return {
          key,
          name: stringOrEmpty(raw?.name) || humanizeToken(key),
          iconUrl: stringOrEmpty(raw?.icon_url),
          bannerUrl: stringOrEmpty(raw?.banner_url),
          genre: stringOrEmpty(raw?.genre),
          // Keep the legacy background assets normalized even though the current
          // hero is banner-first. That lets a future video-first pass reuse the
          // same payload contract without reworking the serving layer.
          backgroundImageUrl: stringOrEmpty(raw?.background_image_url),
          backgroundVideoUrl: stringOrEmpty(raw?.background_video_url),
          profile: {
            profileKey: stringOrEmpty(raw?.profile?.profile_key),
            defaultPreset: normalizePresetKey(raw?.profile?.default_preset),
            allowedResolutions: normalizeResolutionList(raw?.profile?.allowed_resolutions),
            notesShort: stringOrEmpty(raw?.profile?.notes_short),
            biases: {
              "1080p": stringOrEmpty(raw?.profile?.biases?.["1080p"]),
              "1440p": stringOrEmpty(raw?.profile?.biases?.["1440p"]),
              "4k": stringOrEmpty(raw?.profile?.biases?.["4k"])
            },
            tiers: {
              tier_1: {
                key: stringOrEmpty(raw?.profile?.tiers?.tier_1?.key) || "tier-1",
                label: stringOrEmpty(raw?.profile?.tiers?.tier_1?.label) || "Tier 1"
              },
              tier_2: {
                key: stringOrEmpty(raw?.profile?.tiers?.tier_2?.key) || "tier-2",
                label: stringOrEmpty(raw?.profile?.tiers?.tier_2?.label) || "Tier 2"
              },
              tier_3: {
                key: stringOrEmpty(raw?.profile?.tiers?.tier_3?.key) || "tier-3",
                label: stringOrEmpty(raw?.profile?.tiers?.tier_3?.label) || "Tier 3"
              }
            },
            thresholds: {
              "1080p": normalizeThresholds(raw?.profile?.thresholds?.["1080p"]),
              "1440p": normalizeThresholds(raw?.profile?.thresholds?.["1440p"]),
              "4k": normalizeThresholds(raw?.profile?.thresholds?.["4k"])
            }
          }
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function normalizeThresholds(raw) {
    return {
      tier_1_min: toFiniteNumber(raw?.tier_1_min),
      tier_2_min: toFiniteNumber(raw?.tier_2_min),
      tier_3_min: toFiniteNumber(raw?.tier_3_min)
    };
  }

  function normalizeBenchmarks(rawBenchmarks) {
    return (Array.isArray(rawBenchmarks) ? rawBenchmarks : [])
      .map((row) => {
        const gameKey = normalizeToken(row?.game_handle || row?.game || row?.game_key);
        const resolution = normalizeResolutionKey(row?.resolution || row?.res);
        const cpuBenchHandle = normalizeToken(row?.cpu_bench_handle || row?.cpuHandle);
        const gpuBenchHandle = normalizeToken(row?.gpu_bench_handle || row?.gpuHandle);
        const avg = toFiniteNumber(row?.avg ?? row?.fps);

        if (!gameKey || !resolution || !cpuBenchHandle || !gpuBenchHandle || !Number.isFinite(avg)) {
          return null;
        }

        return {
          key:
            stringOrEmpty(row?.key) ||
            [gameKey, resolution, stringOrEmpty(row?.preset), cpuBenchHandle, gpuBenchHandle, avg].join("|"),
          gameKey,
          resolution,
          preset: normalizePresetKey(row?.preset),
          avg,
          fpsLow: toFiniteNumber(row?.fps_low),
          fpsHigh: toFiniteNumber(row?.fps_high),
          cpuBenchHandle,
          gpuBenchHandle
        };
      })
      .filter(Boolean);
  }

  function buildProductCatalog(rawProducts, role) {
    const catalog = new Map();
    const seenEntries = new Set();

    for (const product of Array.isArray(rawProducts) ? rawProducts : []) {
      // Product handles are storefront routing identifiers, not performance identity.
      // FPS Finder always resolves products through the canonical benchmark handle metafields.
      const benchHandle = normalizeToken(role === "cpu" ? product?.bench_cpu_handle : product?.bench_gpu_handle);
      if (!benchHandle) continue;

      const variant = pickDisplayVariant(product);
      if (!variant) continue;
      // CPU platform preference for the upgrade-path lane comes from the existing
      // Shopify processor-socket metafield already exposed in the collection feed.
      const processorSockets = role === "cpu"
        ? normalizeProcessorSocketList(product?.compat?.processor_sockets)
        : [];

      const entry = {
        productId: product?.productId || null,
        handle: stringOrEmpty(product?.handle),
        title: stringOrEmpty(product?.title),
        url: stringOrEmpty(product?.url),
        benchHandle,
        productAvailable: product?.available !== false,
        leadTimeLabel: stringOrEmpty(product?.lead_time_label),
        variant,
        processorSockets,
        platformLabel: getPreferredPlatformLabel(processorSockets)
      };

      const entryKey = [benchHandle, entry.productId, entry.variant.id].join("|");
      if (seenEntries.has(entryKey)) continue;
      seenEntries.add(entryKey);

      if (!catalog.has(benchHandle)) catalog.set(benchHandle, []);
      catalog.get(benchHandle).push(entry);
    }

    for (const entries of catalog.values()) {
      entries.sort(compareProductEntry);
    }

    return catalog;
  }

  function pickDisplayVariant(product) {
    const variants = (Array.isArray(product?.variants) ? product.variants : [])
      .map((variant) => ({
        id: variant?.id || null,
        title: stringOrEmpty(variant?.title),
        available: variant?.available !== false,
        price: toFiniteNumber(variant?.price),
        availabilityTier: toFiniteNumber(variant?.availability_tier),
        leadTimeLabel: stringOrEmpty(variant?.lead_time_label)
      }))
      .filter((variant) => variant.id && Number.isFinite(variant.price));

    if (!variants.length) {
      const fallbackId = product?.variantId || null;
      const fallbackPrice = toFiniteNumber(product?.price);
      if (!fallbackId || !Number.isFinite(fallbackPrice)) return null;

      return {
        id: fallbackId,
        title: "Default Title",
        available: product?.available !== false,
        price: fallbackPrice,
        availabilityTier: toFiniteNumber(product?.availability_tier),
        leadTimeLabel: stringOrEmpty(product?.lead_time_label)
      };
    }

    const availableVariants = variants.filter((variant) => variant.available);
    const preferredPool = availableVariants.length ? availableVariants : variants;
    preferredPool.sort(compareVariantPrice);
    return preferredPool[0];
  }

  function compareProductEntry(left, right) {
    const byPrice = compareVariantPrice(left?.variant, right?.variant);
    if (byPrice !== 0) return byPrice;

    const byAvailability = Number(Boolean(right?.variant?.available)) - Number(Boolean(left?.variant?.available));
    if (byAvailability !== 0) return byAvailability;

    return stringOrEmpty(left?.title).localeCompare(stringOrEmpty(right?.title));
  }

  function compareVariantPrice(a, b) {
    const left = toFiniteNumber(a?.price);
    const right = toFiniteNumber(b?.price);
    if (Number.isFinite(left) && Number.isFinite(right) && left !== right) return left - right;
    return stringOrEmpty(a?.title).localeCompare(stringOrEmpty(b?.title));
  }

  function renderGameOptions(state, ui) {
    const options = state.games
      .map((game) => `<option value="${escapeHtml(game.key)}">${escapeHtml(game.name)}</option>`)
      .join("");

    ui.gameSelect.innerHTML = options || '<option value="">No games found</option>';
  }

  function syncComponentResolution(state) {
    const allowed = collectComponentResolutions(state.games);
    if (!allowed.length) {
      state.selectedResolution = "";
      return;
    }

    if (!allowed.includes(state.selectedResolution)) {
      state.selectedResolution = allowed[0];
    }
  }

  async function loadSelectedPair(state, ui) {
    const selected = getSelectedComponentEntries(state);
    if (!selected.cpu || !selected.gpu) {
      state.pairBenchmarks = [];
      state.loadedPairCpuId = "";
      state.loadedPairGpuId = "";
      renderComponentCentric(state, ui);
      return;
    }

    const requestId = ++state.activePairRequest;
    setStatus(ui, `Loading ${selected.cpu.title} + ${selected.gpu.title}...`, "loading");

    const rows = normalizeBenchmarks(
      await fetchPairPayload(state.cfg.pairDataEndpoint, selected.cpu.benchHandle, selected.gpu.benchHandle)
    );

    if (requestId !== state.activePairRequest) return;

    state.pairBenchmarks = rows;
    state.loadedPairCpuId = stringOrEmpty(state.selectedCpuId);
    state.loadedPairGpuId = stringOrEmpty(state.selectedGpuId);
    renderComponentCentric(state, ui);
  }

  async function loadComponentComparePair(state, ui, pairKey) {
    const comparePairState = state.compare?.[pairKey];
    const selected = getSelectedCompareEntries(state, pairKey);
    if (!comparePairState) return;

    comparePairState.error = "";

    if (!selected.cpu || !selected.gpu) {
      resetComponentComparePairState(comparePairState, false);
      renderComponentCentric(state, ui);
      return;
    }

    const requestId = ++comparePairState.activeRequest;
    comparePairState.loading = true;
    renderComponentCentric(state, ui);

    const rows = normalizeBenchmarks(
      await fetchPairPayload(state.cfg.pairDataEndpoint, selected.cpu.benchHandle, selected.gpu.benchHandle)
    );

    if (requestId !== comparePairState.activeRequest) return;

    comparePairState.pairBenchmarks = rows;
    comparePairState.loading = false;
    renderComponentCentric(state, ui);
  }

  function renderComponentCentric(state, ui) {
    if (!state.games.length) {
      setStatus(ui, state.cfg.copy.emptyResults || "No enabled FPS Finder games are configured yet.", "empty");
      if (ui.stage) ui.stage.innerHTML = "";
      if (ui.picker) ui.picker.innerHTML = "";
      if (ui.results) ui.results.innerHTML = "";
      if (ui.compareShell) {
        ui.compareShell.hidden = true;
        ui.compareShell.innerHTML = "";
      }
      if (ui.browseShell) ui.browseShell.hidden = false;
      if (ui.note) {
        ui.note.hidden = true;
        ui.note.textContent = "";
      }
      return;
    }

    if (!state.gamesByKey.has(state.activeGame)) {
      state.activeGame = state.games[0].key;
    }

    renderCatalogSelect(ui.cpuSelect, state.cpuOptions, state.selectedCpuId, "Select a CPU");
    renderCatalogSelect(ui.gpuSelect, state.gpuOptions, state.selectedGpuId, "Select a GPU");
    renderComponentResolutions(state, ui);
    renderComponentPresets(state, ui);

    const gameResults = buildComponentGameResultsMap(state);
    const activeResult = gameResults.get(state.activeGame) || null;

    renderComponentStage(state, ui, activeResult);
    renderComponentPicker(state, ui, gameResults);
    renderComponentNotes(state, ui, activeResult);
    renderComponentResults(state, ui, activeResult);

    updateComponentViewToggleButtons(ui, state.compare.open);

    if (ui.browseShell) ui.browseShell.hidden = state.compare.open;
    if (ui.compareShell) {
      ui.compareShell.hidden = !state.compare.open;
      ui.compareShell.innerHTML = state.compare.open ? renderComponentCompareMode(state) : "";
      if (state.compare.open) {
        const compareGamesList = ui.compareShell.querySelector("[data-component-compare-games-list]");
        if (compareGamesList) compareGamesList.scrollLeft = state.compare.gamesScrollLeft || 0;
      }
    }

    if (!state.compare.open) {
      updateComponentStatus(state, ui);
    }
  }

  function buildComponentGameResultsMap(
    state,
    benchmarkRows = state.pairBenchmarks,
    hasPair = hasSelectedComponentPair(state),
    resolutionOverride = state.selectedResolution,
    presetOverride = state.selectedPreset
  ) {
    const results = new Map();
    const resolution = normalizeResolutionKey(resolutionOverride);
    const preset = normalizePresetKey(presetOverride) || "medium";
    const rowByGame = new Map();

    if (hasPair) {
      for (const row of Array.isArray(benchmarkRows) ? benchmarkRows : []) {
        if (row.resolution !== resolution) continue;
        if (normalizePresetKey(row.preset) !== preset) continue;

        const current = rowByGame.get(row.gameKey);
        // If authoring accidentally creates multiple rows for the exact same
        // pair and context, surface the strongest row until the dataset is normalized.
        if (!current || toFiniteNumber(row?.avg) > toFiniteNumber(current?.avg)) {
          rowByGame.set(row.gameKey, row);
        }
      }
    }

    for (const game of state.games) {
      const supportedResolution = isGameResolutionAllowed(game, resolution);
      const row = rowByGame.get(game.key) || null;
      const tierId = supportedResolution && row ? classifyTier(row.avg, game.profile?.thresholds?.[resolution]) : "";
      let stateName = "awaiting_pair";

      if (hasPair) {
        if (!supportedResolution) {
          stateName = "unsupported";
        } else if (!row) {
          stateName = "no_data";
        } else if (tierId) {
          stateName = "benchmarked";
        } else {
          stateName = "below_floor";
        }
      }

      results.set(game.key, {
        game,
        row,
        tierId,
        tier: tierId ? game.profile?.tiers?.[tierId] || null : null,
        stateName,
        resolution,
        preset,
        supportedResolution
      });
    }

    return results;
  }

  function renderComponentResolutions(state, ui) {
    const allowed = collectComponentResolutions(state.games);
    ui.resolutions.innerHTML = allowed
      .map((resolution) => {
        const meta = RESOLUTION_META[resolution] || { label: resolution };
        const activeClass = resolution === state.selectedResolution ? " is-active" : "";
        return `<button type="button" class="ucp-fpsf__resolution ucp-fpsf__component-compare-chip${activeClass}" data-resolution="${escapeAttribute(resolution)}">${escapeHtml(meta.label)}</button>`;
      })
      .join("");
  }

  function renderComponentPresets(state, ui) {
    ui.presets.innerHTML = PRESET_ORDER
      .map((preset) => {
        const meta = PRESET_META[preset] || { label: humanizeToken(preset) };
        const activeClass = preset === state.selectedPreset ? " is-active" : "";
        return `<button type="button" class="ucp-fpsf__preset ucp-fpsf__component-compare-chip${activeClass}" data-preset="${escapeAttribute(preset)}">${escapeHtml(meta.label)}</button>`;
      })
      .join("");
  }

  function renderComponentStage(state, ui, activeResult) {
    if (!ui.stage || !activeResult?.game) return;

    const game = activeResult.game;
    const selected = getSelectedComponentEntries(state);
    const metaParts = [];
    if (game.genre) metaParts.push(game.genre);
    if (game.profile?.profileKey) metaParts.push(`Profile: ${game.profile.profileKey}`);
    const heroImageUrl = pickGameHeroImage(game);
    const heroChips = [
      `<span class="ucp-fpsf__selected-chip">${escapeHtml(humanizeToken(activeResult.resolution))}</span>`,
      `<span class="ucp-fpsf__selected-chip">${escapeHtml(humanizeToken(activeResult.preset))}</span>`,
      `<span class="ucp-fpsf__selected-chip ucp-fpsf__selected-chip--accent">${escapeHtml(renderComponentStateLabel(activeResult))}</span>`
    ];

    if (selected.cpu && selected.gpu) {
      heroChips.push(`<span class="ucp-fpsf__selected-chip">${escapeHtml(formatMoney((toFiniteNumber(selected.cpu?.variant?.price) || 0) + (toFiniteNumber(selected.gpu?.variant?.price) || 0)))}</span>`);
    }

    const pairSummary = selected.cpu && selected.gpu
      ? `${selected.cpu.title} + ${selected.gpu.title}`
      : "Choose a CPU and GPU to browse FPS across your games.";

    ui.stage.innerHTML = `
      <div class="ucp-fpsf__selected-stage ucp-fpsf__selected-stage--component">
        <div class="ucp-fpsf__selected-media${heroImageUrl ? "" : " is-empty"}">
          ${heroImageUrl ? `<img class="ucp-fpsf__selected-banner" src="${escapeAttribute(heroImageUrl)}" alt="${escapeAttribute(game.name)} artwork">` : '<div class="ucp-fpsf__selected-banner-fallback" aria-hidden="true"></div>'}
        </div>
        <div class="ucp-fpsf__selected-glow" aria-hidden="true"></div>
        <div class="ucp-fpsf__selected-content">
          <div class="ucp-fpsf__selected-topline">
            ${game.iconUrl ? `<img class="ucp-fpsf__selected-icon" src="${escapeAttribute(game.iconUrl)}" alt="${escapeAttribute(game.name)}">` : '<div class="ucp-fpsf__selected-icon" aria-hidden="true"></div>'}
            <div class="ucp-fpsf__selected-chip-row">${heroChips.join("")}</div>
          </div>
          <p class="ucp-fpsf__selected-kicker">Component Centric FPS Finder</p>
          <p class="ucp-fpsf__selected-name">${escapeHtml(game.name)}</p>
          <p class="ucp-fpsf__selected-meta">${escapeHtml(metaParts.join(" | ") || "Benchmark-backed game profile")}</p>
          <p class="ucp-fpsf__selected-pair">${escapeHtml(pairSummary)}</p>
        </div>
      </div>
    `;
  }

  function renderComponentPicker(state, ui, gameResults) {
    if (!ui.picker) return;

    const totalGames = state.games.length;
    const activeIndex = Math.max(0, state.games.findIndex((game) => game.key === state.activeGame));
    const pickerMarkup = state.games
      .map((game) => {
        const result = gameResults.get(game.key);
        const isActive = game.key === state.activeGame;
        const stateName = stringOrEmpty(result?.stateName || "awaiting_pair");
        const awaitingLogoMarkup = stateName === "awaiting_pair" && state.cfg.awaitingTileLogoUrl
          ? `
            <span class="ucp-fpsf__component-game-logo">
              <img class="ucp-fpsf__component-game-logoImage" src="${escapeAttribute(state.cfg.awaitingTileLogoUrl)}" alt="">
            </span>
          `
          : "";
        const stateMarkup = stateName !== "awaiting_pair"
          ? `<span class="ucp-fpsf__component-game-state">${escapeHtml(renderComponentStateLabel(result))}</span>`
          : "";
        return `
          <button
            type="button"
            class="ucp-fpsf__component-game${isActive ? " is-active" : ""} is-${escapeAttribute(stateName)}"
            data-component-game="${escapeAttribute(game.key)}"
          >
            ${awaitingLogoMarkup}
            <span class="ucp-fpsf__component-game-name">${escapeHtml(game.name)}</span>
            ${stateMarkup}
          </button>
        `;
      })
      .join("");

    ui.picker.innerHTML = `
      <div class="ucp-fpsf__component-picker-head">
        <div>
          <p class="ucp-fpsf__component-picker-eyebrow">Browse game performance</p>
          <p class="ucp-fpsf__component-picker-meta">Game ${activeIndex + 1} of ${totalGames}</p>
        </div>
        <div class="ucp-fpsf__component-picker-actions">
          <button type="button" class="ucp-fpsf__compare-action" data-component-nav="prev">Previous</button>
          <button type="button" class="ucp-fpsf__compare-action" data-component-nav="next">Next</button>
        </div>
      </div>
      <div class="ucp-fpsf__component-picker-list">
        ${pickerMarkup}
      </div>
    `;
  }

  function renderComponentNotes(state, ui, activeResult) {
    if (!ui.note || !activeResult?.game) return;

    const noteParts = [];
    if (activeResult.game.profile?.notesShort) noteParts.push(activeResult.game.profile.notesShort);
    if (activeResult.supportedResolution) {
      const resBias = activeResult.game.profile?.biases?.[state.selectedResolution];
      if (resBias) noteParts.push(resBias);
    }

    if (!noteParts.length) {
      ui.note.hidden = true;
      ui.note.textContent = "";
      return;
    }

    ui.note.hidden = false;
    ui.note.textContent = noteParts.join(" ");
  }

  function renderComponentResults(state, ui, activeResult) {
    if (!ui.results || !activeResult?.game) return;

    const selected = getSelectedComponentEntries(state);
    if (!selected.cpu || !selected.gpu) {
      ui.results.innerHTML = `
        <div class="ucp-fpsf__empty ucp-fpsf__component-empty">
          Choose a CPU and GPU to see the benchmark-backed FPS and tier result for ${escapeHtml(activeResult.game.name)}.
        </div>
      `;
      return;
    }

    const disableForAvailability = state.cfg.disableCtaWhenUnavailable && !isSelectedPairPurchasable(selected);
    const href = disableForAvailability
      ? ""
      : buildBuilderUrl(state.cfg.builderPageUrl, selected.cpu?.variant?.id, selected.gpu?.variant?.id);
    const ctaLabel = href
      ? "Open this pair in PC Builder"
      : disableForAvailability
        ? "Temporarily unavailable"
        : "Builder link unavailable";

    const rangeLabel = Number.isFinite(toFiniteNumber(activeResult.row?.fpsLow)) && Number.isFinite(toFiniteNumber(activeResult.row?.fpsHigh))
      ? `${Math.round(activeResult.row.fpsLow)}-${Math.round(activeResult.row.fpsHigh)} FPS`
      : "N/A";
    const tierValue = activeResult.tier?.label || (activeResult.stateName === "below_floor" ? "Below tier floor" : renderComponentStateLabel(activeResult));
    const narrative = renderComponentNarrative(activeResult);

    ui.results.innerHTML = `
      <article class="ucp-fpsf__card ucp-fpsf__card--top ucp-fpsf__component-result-card${isSelectedPairPurchasable(selected) ? "" : " is-unavailable"}">
        <div class="ucp-fpsf__card-head ucp-fpsf__card-head--top">
          <div>
            <p class="ucp-fpsf__lane-label">Selected CPU + GPU Pair</p>
            <p class="ucp-fpsf__recommendation-rationale">${escapeHtml(narrative)}</p>
          </div>
          <div class="ucp-fpsf__card-flags ucp-fpsf__card-flags--top">
            <span class="ucp-fpsf__summary-chip">${escapeHtml(humanizeToken(activeResult.resolution))}</span>
            <span class="ucp-fpsf__summary-chip">${escapeHtml(humanizeToken(activeResult.preset))}</span>
            <span class="ucp-fpsf__summary-chip ucp-fpsf__summary-chip--platform">${escapeHtml(renderComponentStateLabel(activeResult))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__metrics">
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">Average FPS</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatFps(activeResult.row?.avg))}</span>
          </div>
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">Tier result</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(tierValue)}</span>
          </div>
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">FPS range</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(rangeLabel)}</span>
          </div>
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">CPU + GPU price</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatMoney((toFiniteNumber(selected.cpu?.variant?.price) || 0) + (toFiniteNumber(selected.gpu?.variant?.price) || 0)))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__parts">
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">CPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(selected.cpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(renderComponentEntryMeta(selected.cpu))}</span>
          </div>
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">GPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(selected.gpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(renderComponentEntryMeta(selected.gpu))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__card-actions">
          <a class="ucp-fpsf__cta" href="${escapeAttribute(href || "#")}"${renderBuilderCtaTrackingAttributes("fps_finder_single_pair_builder", href)}${href ? "" : ' aria-disabled="true"'}>${escapeHtml(ctaLabel)}</a>
        </div>
      </article>
    `;
  }

  function updateComponentStatus(state, ui) {
    if (!hasSelectedComponentPair(state)) {
      setStatus(ui, "Select a CPU and GPU to browse FPS across the enabled games catalog.", "info");
      return;
    }

    if (!Array.isArray(state.pairBenchmarks) || !state.pairBenchmarks.length) {
      setStatus(ui, "No benchmark rows exist for this exact CPU + GPU pair yet. You can still browse games that need coverage.", "empty");
      return;
    }

    setStatus(ui, "", "ready");
  }

  function collectComponentResolutions(games) {
    const present = new Set();
    for (const game of Array.isArray(games) ? games : []) {
      const allowed = Array.isArray(game?.profile?.allowedResolutions) ? game.profile.allowedResolutions : [];
      for (const resolution of allowed) {
        const normalized = normalizeResolutionKey(resolution);
        if (normalized) present.add(normalized);
      }
    }

    return Object.keys(RESOLUTION_META).filter((resolution) => present.has(resolution));
  }

  function getSelectedComponentEntries(state) {
    return {
      cpu: state.cpuOptionsById.get(state.selectedCpuId) || null,
      gpu: state.gpuOptionsById.get(state.selectedGpuId) || null
    };
  }

  function getSelectedCompareEntries(state, pairKey = "pairB") {
    const pairState = state.compare?.[pairKey];
    return {
      cpu: state.cpuOptionsById.get(pairState?.selectedCpuId) || null,
      gpu: state.gpuOptionsById.get(pairState?.selectedGpuId) || null
    };
  }

  function hasSelectedComponentPair(state) {
    const selected = getSelectedComponentEntries(state);
    return Boolean(selected.cpu && selected.gpu);
  }

  function hasLoadedSelectedComponentPair(state) {
    return Boolean(
      stringOrEmpty(state.selectedCpuId) &&
      stringOrEmpty(state.selectedGpuId) &&
      stringOrEmpty(state.loadedPairCpuId) === stringOrEmpty(state.selectedCpuId) &&
      stringOrEmpty(state.loadedPairGpuId) === stringOrEmpty(state.selectedGpuId)
    );
  }

  function hasSelectedComparePair(state, pairKey = "pairB") {
    const selected = getSelectedCompareEntries(state, pairKey);
    return Boolean(selected.cpu && selected.gpu);
  }

  function isSelectedPairPurchasable(selected) {
    return Boolean(selected?.cpu?.variant?.available && selected?.gpu?.variant?.available);
  }

  function areSameComponentBenchPairs(left, right) {
    return Boolean(
      left?.cpu?.benchHandle &&
      left?.gpu?.benchHandle &&
      right?.cpu?.benchHandle &&
      right?.gpu?.benchHandle &&
      left.cpu.benchHandle === right.cpu.benchHandle &&
      left.gpu.benchHandle === right.gpu.benchHandle
    );
  }

  function isGameResolutionAllowed(game, resolution) {
    const allowed = Array.isArray(game?.profile?.allowedResolutions) ? game.profile.allowedResolutions : [];
    return allowed.includes(resolution);
  }

  function stepComponentActiveGame(state, direction) {
    const order = state.games.map((game) => game.key);
    if (!order.length) return;

    const currentIndex = Math.max(0, order.indexOf(state.activeGame));
    const delta = direction === "prev" ? -1 : 1;
    const nextIndex = (currentIndex + delta + order.length) % order.length;
    state.activeGame = order[nextIndex];
  }

  function renderComponentStateLabel(result) {
    const stateName = stringOrEmpty(result?.stateName);
    if (stateName === "benchmarked") return result?.tier?.label || "Benchmarked";
    if (stateName === "below_floor") return "Below tier floor";
    if (stateName === "no_data") return "No benchmark";
    if (stateName === "unsupported") return `${humanizeToken(result?.resolution)} unavailable`;
    return "Select pair";
  }

  function renderComponentEntryMeta(entry) {
    return [getPartStatus(entry), formatMoney(entry?.variant?.price)].filter(Boolean).join(" | ");
  }

  function renderComponentNarrative(activeResult) {
    if (activeResult.stateName === "benchmarked") {
      return `This exact CPU and GPU pair has authored benchmark coverage for ${activeResult.game.name} at ${humanizeToken(activeResult.resolution)} ${humanizeToken(activeResult.preset)}.`;
    }

    if (activeResult.stateName === "below_floor") {
      return `This pair has benchmark coverage, but its average FPS stays below the first authored tier floor for ${activeResult.game.name}.`;
    }

    if (activeResult.stateName === "unsupported") {
      return `${activeResult.game.name} is not authored for ${humanizeToken(activeResult.resolution)} in the current FPS Finder profile yet.`;
    }

    if (activeResult.stateName === "no_data") {
      return `No benchmark row exists for this exact CPU + GPU pair at ${activeResult.game.name}, ${humanizeToken(activeResult.resolution)}, and ${humanizeToken(activeResult.preset)} yet.`;
    }

    return `Choose a CPU and GPU first, then browse games to see exact benchmark-backed FPS results for the focused title.`;
  }

  async function openComponentCompareMode(state, ui) {
    const compareState = state.compare;
    const isFirstOpen = !compareState.initialized;

    compareState.open = true;
    syncSinglePairIntoComparePairA(state);

    if (isFirstOpen) {
      compareState.gamesScrollLeft = 0;
      compareState.selectedResolution = normalizeResolutionKey(state.selectedResolution);
      compareState.selectedPreset = normalizePresetKey(state.selectedPreset) || "medium";
      resetComponentComparePairState(compareState.pairB, true);
      compareState.selectedGameKeys = state.activeGame && state.gamesByKey.has(state.activeGame)
        ? [state.activeGame]
        : state.games[0]
          ? [state.games[0].key]
          : [];
    }

    compareState.initialized = true;
    syncComponentCompareResolution(state);
    ensureComponentCompareGames(state);

    if (hasSelectedComparePair(state, "pairA") && !hasLoadedSelectedComponentPair(state)) {
      await loadComponentComparePair(state, ui, "pairA");
      return;
    }

    renderComponentCentric(state, ui);
  }

  async function closeComponentCompareMode(state, ui) {
    const nextCpuId = stringOrEmpty(state.compare?.pairA?.selectedCpuId);
    const nextGpuId = stringOrEmpty(state.compare?.pairA?.selectedGpuId);
    const selectionChanged = nextCpuId && nextGpuId && (
      nextCpuId !== state.selectedCpuId ||
      nextGpuId !== state.selectedGpuId
    );

    state.compare.open = false;

    if (selectionChanged) {
      state.selectedCpuId = nextCpuId;
      state.selectedGpuId = nextGpuId;
      await loadSelectedPair(state, ui);
      return;
    }

    renderComponentCentric(state, ui);
  }

  function syncComponentCompareResolution(state) {
    const allowed = collectComponentResolutions(state.games);
    if (!allowed.length) {
      state.compare.selectedResolution = "";
      return;
    }

    if (!allowed.includes(state.compare.selectedResolution)) {
      state.compare.selectedResolution = allowed.includes(state.selectedResolution)
        ? state.selectedResolution
        : allowed[0];
    }
  }

  function renderComponentCompareMode(state) {
    const compareState = state.compare;
    const pairA = getSelectedCompareEntries(state, "pairA");
    const pairB = getSelectedCompareEntries(state, "pairB");
    const pairAGameResults = buildComponentGameResultsMap(
      state,
      compareState.pairA.pairBenchmarks,
      hasSelectedComparePair(state, "pairA"),
      compareState.selectedResolution,
      compareState.selectedPreset
    );
    const pairBGameResults = buildComponentGameResultsMap(
      state,
      compareState.pairB.pairBenchmarks,
      hasSelectedComparePair(state, "pairB"),
      compareState.selectedResolution,
      compareState.selectedPreset
    );
    const compareGameKeys = getSelectedComponentCompareGameKeys(state);
    const graphRows = compareGameKeys
      .map((gameKey) => ({
        game: state.gamesByKey.get(gameKey) || null,
        pairA: pairAGameResults.get(gameKey) || null,
        pairB: pairBGameResults.get(gameKey) || null
      }))
      .filter((row) => row.game);
    const maxAverage = graphRows.reduce((max, row) => {
      const pairAAvg = toFiniteNumber(row?.pairA?.row?.avg);
      const pairBAvg = toFiniteNumber(row?.pairB?.row?.avg);
      return Math.max(
        max,
        Number.isFinite(pairAAvg) ? pairAAvg : 0,
        Number.isFinite(pairBAvg) ? pairBAvg : 0
      );
    }, 0);
    const compareResolutionMarkup = collectComponentResolutions(state.games)
      .map((resolution) => {
        const meta = RESOLUTION_META[resolution] || { label: resolution };
        const activeClass = resolution === compareState.selectedResolution ? " is-active" : "";
        return `<button type="button" class="ucp-fpsf__resolution ucp-fpsf__component-compare-chip${activeClass}" data-component-compare-resolution="${escapeAttribute(resolution)}">${escapeHtml(meta.label)}</button>`;
      })
      .join("");
    const comparePresetMarkup = PRESET_ORDER
      .map((preset) => {
        const meta = PRESET_META[preset] || { label: humanizeToken(preset) };
        const activeClass = preset === compareState.selectedPreset ? " is-active" : "";
        return `<button type="button" class="ucp-fpsf__preset ucp-fpsf__component-compare-chip${activeClass}" data-component-compare-preset="${escapeAttribute(preset)}">${escapeHtml(meta.label)}</button>`;
      })
      .join("");
    const gamesMarkup = state.games
      .map((game) => {
        const selectedClass = compareGameKeys.includes(game.key) ? " is-selected" : "";
        const iconMarkup = game.iconUrl
          ? `<img class="ucp-fpsf__component-compare-game-icon" src="${escapeAttribute(game.iconUrl)}" alt="${escapeAttribute(game.name)} icon">`
          : '<span class="ucp-fpsf__component-compare-game-iconFallback" aria-hidden="true"></span>';
        return `
          <button
            type="button"
            class="ucp-fpsf__component-compare-game${selectedClass}"
            data-component-compare-game="${escapeAttribute(game.key)}"
          >
            ${iconMarkup}
            <span class="ucp-fpsf__component-compare-game-name">${escapeHtml(game.name)}</span>
          </button>
        `;
      })
      .join("");

    return `
      <section class="ucp-fpsf__component-compare-shell ucp-fpsf__component-compare-shell--mode">
        <div class="ucp-fpsf__component-compare-head">
          <div>
            <p class="ucp-fpsf__component-compare-eyebrow">Component Compare Mode</p>
            <h3 class="ucp-fpsf__component-compare-title">Compare two CPU + GPU pairs across selected games</h3>
            <p class="ucp-fpsf__component-compare-meta">Pick Pair A and Pair B, choose the games that matter, then adjust the compare-only resolution and preset above the graph.</p>
          </div>
        </div>

        <div class="ucp-fpsf__component-compare-grid">
          ${renderComponentComparePairCard(state, "a", pairA, compareState.pairA)}
          ${renderComponentComparePairCard(state, "b", pairB, compareState.pairB)}
        </div>

        <div class="ucp-fpsf__component-compare-filters">
          <div class="ucp-fpsf__field ucp-fpsf__component-compare-filterRow">
            <span class="ucp-fpsf__label">Compare Resolution</span>
            <div class="ucp-fpsf__resolutions ucp-fpsf__component-compare-chipGroup" aria-live="polite">${compareResolutionMarkup}</div>
          </div>

          <div class="ucp-fpsf__field ucp-fpsf__component-compare-filterRow">
            <span class="ucp-fpsf__label">Preset</span>
            <div class="ucp-fpsf__presets ucp-fpsf__component-compare-chipGroup" aria-live="polite">${comparePresetMarkup}</div>
          </div>
        </div>

        <div class="ucp-fpsf__component-compare-games">
          <div class="ucp-fpsf__component-compare-games-head">
            <p class="ucp-fpsf__component-compare-games-title">Games to include</p>
            <div class="ucp-fpsf__component-compare-games-actions">
              <button type="button" class="ucp-fpsf__compare-action ucp-fpsf__component-compare-scroll" data-component-compare-scroll="prev">Prev</button>
              <button type="button" class="ucp-fpsf__compare-action ucp-fpsf__component-compare-scroll" data-component-compare-scroll="next">Next</button>
            </div>
          </div>
          <div class="ucp-fpsf__component-compare-games-carousel">
            <div class="ucp-fpsf__component-compare-games-list" data-component-compare-games-list>
              ${gamesMarkup}
            </div>
          </div>
        </div>

        ${renderComponentCompareContent(state, graphRows, maxAverage)}
      </section>
    `;
  }

  function renderComponentComparePairCard(state, pairToken, selected, pairState) {
    const pairLabel = pairToken === "a" ? "Pair A" : "Pair B";
    const pairIntro = pairToken === "a"
      ? "This pair syncs back to the main component-centric selection when you leave compare mode."
      : "Choose a second CPU and GPU pair to measure the FPS difference across the same games.";
    const disableForAvailability = state.cfg.disableCtaWhenUnavailable && !isSelectedPairPurchasable(selected);
    const href = disableForAvailability
      ? ""
      : buildBuilderUrl(state.cfg.builderPageUrl, selected.cpu?.variant?.id, selected.gpu?.variant?.id);
    const ctaLabel = !selected.cpu || !selected.gpu
      ? `Select ${pairLabel} CPU + GPU`
      : href
        ? `Open ${pairLabel} in PC Builder`
        : disableForAvailability
          ? "Temporarily unavailable"
          : "Builder link unavailable";
    const pairPrice = selected.cpu && selected.gpu
      ? formatMoney((toFiniteNumber(selected.cpu?.variant?.price) || 0) + (toFiniteNumber(selected.gpu?.variant?.price) || 0))
      : "Choose a CPU and GPU";
    const pairStateMessage = renderComponentComparePairState(selected, pairState, pairLabel);

    return `
      <article class="ucp-fpsf__component-compare-pair${selected.cpu && selected.gpu ? "" : " is-empty"}">
        <div class="ucp-fpsf__component-compare-pair-head">
          <p class="ucp-fpsf__component-compare-pair-kicker">${escapeHtml(pairLabel)}</p>
          <h4 class="ucp-fpsf__component-compare-pair-title">${escapeHtml(pairToken === "a" ? "Primary pair" : "Compared pair")}</h4>
          <p class="ucp-fpsf__component-compare-pair-summary">${escapeHtml(buildComponentPairSummary(selected, pairIntro))}</p>
        </div>

        <div class="ucp-fpsf__component-compare-pair-controls">
          <label class="ucp-fpsf__field" for="ucp-fps-finder-component-compare-${escapeAttribute(pairToken)}-cpu">
            <span class="ucp-fpsf__label">${escapeHtml(pairLabel)} CPU</span>
            <select
              id="ucp-fps-finder-component-compare-${escapeAttribute(pairToken)}-cpu"
              class="ucp-fpsf__select"
              data-component-compare-pair="${escapeAttribute(pairToken)}"
              data-component-compare-cpu
            >
              ${renderCatalogSelectOptionsMarkup(state.cpuOptions, pairState.selectedCpuId, `Select ${pairLabel} CPU`)}
            </select>
          </label>

          <label class="ucp-fpsf__field" for="ucp-fps-finder-component-compare-${escapeAttribute(pairToken)}-gpu">
            <span class="ucp-fpsf__label">${escapeHtml(pairLabel)} GPU</span>
            <select
              id="ucp-fps-finder-component-compare-${escapeAttribute(pairToken)}-gpu"
              class="ucp-fpsf__select"
              data-component-compare-pair="${escapeAttribute(pairToken)}"
              data-component-compare-gpu
            >
              ${renderCatalogSelectOptionsMarkup(state.gpuOptions, pairState.selectedGpuId, `Select ${pairLabel} GPU`)}
            </select>
          </label>
        </div>

        <div class="ucp-fpsf__component-compare-pair-foot">
          <div>
            <p class="ucp-fpsf__component-compare-pair-price">${escapeHtml(pairPrice)}</p>
            ${pairStateMessage ? `<p class="ucp-fpsf__component-compare-pair-state">${escapeHtml(pairStateMessage)}</p>` : ""}
          </div>
          <a class="ucp-fpsf__cta" href="${escapeAttribute(href || "#")}"${renderBuilderCtaTrackingAttributes("fps_finder_compare_pair_builder", href)}${href ? "" : ' aria-disabled="true"'}>${escapeHtml(ctaLabel)}</a>
        </div>
      </article>
    `;
  }

  function renderComponentComparePairState(selected, pairState, pairLabel) {
    if (!selected.cpu || !selected.gpu) return `${pairLabel} is waiting for a complete CPU + GPU selection.`;
    if (pairState.loading) return `${pairLabel} benchmark rows are loading...`;
    if (pairState.error) return pairState.error;
    if (!Array.isArray(pairState.pairBenchmarks) || !pairState.pairBenchmarks.length) {
      return `No authored benchmark rows exist for this exact ${pairLabel.toLowerCase()} yet.`;
    }
    return "";
  }

  function renderComponentCompareContent(state, graphRows, maxAverage) {
    const pairA = getSelectedCompareEntries(state, "pairA");
    const pairB = getSelectedCompareEntries(state, "pairB");
    const pairAState = state.compare.pairA;
    const pairBState = state.compare.pairB;

    if (!graphRows.length) {
      return `<div class="ucp-fpsf__compare-empty ucp-fpsf__component-compare-empty">Pick at least one game to build the comparison graph.</div>`;
    }

    if (!pairA.cpu || !pairA.gpu) {
      return `<div class="ucp-fpsf__compare-empty ucp-fpsf__component-compare-empty">Choose Pair A first. This is the pair that syncs back into normal browse mode.</div>`;
    }

    if (!pairB.cpu || !pairB.gpu) {
      return `<div class="ucp-fpsf__compare-empty ucp-fpsf__component-compare-empty">Choose Pair B to start plotting the grouped FPS graph.</div>`;
    }

    if (areSameComponentBenchPairs(pairA, pairB)) {
      return `<div class="ucp-fpsf__compare-empty ucp-fpsf__component-compare-empty">Choose a different CPU or GPU for Pair B so the graph shows a meaningful difference.</div>`;
    }

    if (pairAState.loading || pairBState.loading) {
      return `<div class="ucp-fpsf__compare-empty ucp-fpsf__component-compare-empty">Loading compare benchmark data...</div>`;
    }

    if (pairAState.error || pairBState.error) {
      return `<div class="ucp-fpsf__compare-empty ucp-fpsf__component-compare-empty">${escapeHtml(pairAState.error || pairBState.error)}</div>`;
    }

    const rowsMarkup = graphRows.map((row) => renderComponentCompareGraphRow(row, maxAverage)).join("");
    return `<div class="ucp-fpsf__component-compare-graph">${rowsMarkup}</div>`;
  }

  function renderComponentCompareGraphRow(row, maxAverage) {
    const baselineAvg = toFiniteNumber(row?.pairA?.row?.avg);
    const alternateAvg = toFiniteNumber(row?.pairB?.row?.avg);
    const baselineHasValue = Number.isFinite(baselineAvg);
    const alternateHasValue = Number.isFinite(alternateAvg);
    const deltaLabel = baselineHasValue && alternateHasValue
      ? renderComponentCompareDeltaLabel(baselineAvg, alternateAvg)
      : "";

    return `
      <article class="ucp-fpsf__component-compare-row">
        <div class="ucp-fpsf__component-compare-row-head">
          <div>
            <div class="ucp-fpsf__component-compare-row-titleWrap">
              ${row.game.iconUrl
                ? `<img class="ucp-fpsf__component-compare-row-icon" src="${escapeAttribute(row.game.iconUrl)}" alt="${escapeAttribute(row.game.name)} icon">`
                : '<span class="ucp-fpsf__component-compare-row-iconFallback" aria-hidden="true"></span>'}
              <p class="ucp-fpsf__component-compare-row-title">${escapeHtml(row.game.name)}</p>
            </div>
            <p class="ucp-fpsf__component-compare-row-meta">${escapeHtml(renderComponentCompareRowMeta(row.pairA, row.pairB))}</p>
          </div>
          ${deltaLabel ? `<span class="ucp-fpsf__component-compare-delta">${escapeHtml(deltaLabel)}</span>` : ""}
        </div>

        <div class="ucp-fpsf__component-compare-bars">
          ${renderComponentCompareBar("Pair A", baselineAvg, row?.pairA, maxAverage, "baseline")}
          ${renderComponentCompareBar("Pair B", alternateAvg, row?.pairB, maxAverage, "alternate")}
        </div>
      </article>
    `;
  }

  function renderComponentCompareBar(label, average, result, maxAverage, modifier) {
    const hasValue = Number.isFinite(average);
    const width = hasValue && maxAverage > 0 ? Math.max((average / maxAverage) * 100, 6) : 0;

    return `
      <div class="ucp-fpsf__component-compare-bar-row">
        <span class="ucp-fpsf__component-compare-bar-label">${escapeHtml(label)}</span>
        <div class="ucp-fpsf__component-compare-bar-track">
          ${hasValue
            ? `<span class="ucp-fpsf__component-compare-bar ucp-fpsf__component-compare-bar--${escapeAttribute(modifier)}" style="width:${width.toFixed(2)}%"></span>`
            : '<span class="ucp-fpsf__component-compare-bar-empty"></span>'}
        </div>
        <span class="ucp-fpsf__component-compare-bar-value">${escapeHtml(hasValue ? formatFps(average) : renderComponentStateLabel(result))}</span>
      </div>
    `;
  }

  function renderComponentCompareDeltaLabel(baselineAvg, alternateAvg) {
    if (!Number.isFinite(baselineAvg) || !Number.isFinite(alternateAvg) || baselineAvg <= 0) {
      return "Est. delta n/a";
    }

    const percent = Math.round(((alternateAvg - baselineAvg) / baselineAvg) * 100);
    if (percent > 0) return `Est. +${percent}% vs Pair A`;
    if (percent < 0) return `Est. ${percent}% vs Pair A`;
    return "Est. 0% vs Pair A";
  }

  function renderComponentCompareRowMeta(baselineResult, alternateResult) {
    const parts = [];
    if (baselineResult) parts.push(`Pair A: ${baselineResult?.tier?.label || renderComponentStateLabel(baselineResult)}`);
    if (alternateResult) parts.push(`Pair B: ${alternateResult?.tier?.label || renderComponentStateLabel(alternateResult)}`);
    return parts.join(" | ") || "Average FPS comparison";
  }

  function buildComponentPairSummary(pair, fallback = "Choose a pair") {
    if (!pair?.cpu || !pair?.gpu) return fallback;
    return `${pair.cpu.title} + ${pair.gpu.title}`;
  }

  function syncSinglePairIntoComparePairA(state) {
    const pairAState = state.compare?.pairA;
    if (!pairAState) return;

    pairAState.selectedCpuId = stringOrEmpty(state.selectedCpuId);
    pairAState.selectedGpuId = stringOrEmpty(state.selectedGpuId);
    pairAState.pairBenchmarks = hasLoadedSelectedComponentPair(state) && Array.isArray(state.pairBenchmarks)
      ? state.pairBenchmarks.slice()
      : [];
    pairAState.activeRequest = 0;
    pairAState.loading = false;
    pairAState.error = "";
  }

  function updateComponentViewToggleButtons(ui, compareOpen) {
    const activeMode = compareOpen ? "compare" : "single";
    for (const button of Array.isArray(ui.viewToggleButtons) ? ui.viewToggleButtons : []) {
      const buttonMode = stringOrEmpty(button?.getAttribute("data-component-view-toggle"));
      const isActive = buttonMode === activeMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }

  function getSelectedComponentCompareGameKeys(state) {
    return (Array.isArray(state.compare?.selectedGameKeys) ? state.compare.selectedGameKeys : [])
      .map((gameKey) => normalizeToken(gameKey))
      .filter((gameKey, index, keys) => gameKey && state.gamesByKey.has(gameKey) && keys.indexOf(gameKey) === index);
  }

  function ensureComponentCompareGames(state) {
    const validKeys = getSelectedComponentCompareGameKeys(state);
    if (validKeys.length) {
      state.compare.selectedGameKeys = validKeys;
      return;
    }

    state.compare.selectedGameKeys = state.activeGame && state.gamesByKey.has(state.activeGame)
      ? [state.activeGame]
      : state.games[0]
        ? [state.games[0].key]
        : [];
  }

  function toggleComponentCompareGame(state, gameKey) {
    if (!gameKey || !state.gamesByKey.has(gameKey)) return;

    const currentKeys = getSelectedComponentCompareGameKeys(state);
    if (currentKeys.includes(gameKey)) {
      state.compare.selectedGameKeys = currentKeys.filter((key) => key !== gameKey);
      return;
    }

    state.compare.selectedGameKeys = [...currentKeys, gameKey];
  }

  function syncResolution(state) {
    const game = state.gamesByKey.get(state.selectedGame);
    const allowed = Array.isArray(game?.profile?.allowedResolutions) ? game.profile.allowedResolutions : [];

    if (!allowed.length) {
      state.selectedResolution = "";
      return;
    }

    if (!allowed.includes(state.selectedResolution)) {
      state.selectedResolution = allowed[0];
    }
  }

  function render(state, ui) {
    const game = state.gamesByKey.get(state.selectedGame);
    if (!game) {
      setStatus(ui, state.cfg.copy.emptyResults || "No enabled FPS Finder games are configured yet.", "empty");
      ui.results.innerHTML = "";
      ui.note.hidden = true;
      ui.selectedGame.hidden = true;
      ui.resolutions.innerHTML = "";
      if (ui.presets) ui.presets.innerHTML = "";
      if (ui.recommendations) {
        ui.recommendations.hidden = true;
        ui.recommendations.innerHTML = "";
      }
      if (ui.compare) {
        ui.compare.hidden = true;
        ui.compare.innerHTML = "";
      }
      return;
    }

    ui.gameSelect.value = game.key;
    renderSelectedGame(game, ui);
    renderResolutions(game, state, ui);
    renderPresets(game, state, ui);
    renderNotes(game, state, ui);

    const gameBenchmarks = state.gameBenchmarksByKey.get(game.key) || [];
    const selection = buildSelectionCandidates(state, game, gameBenchmarks);
    const tierGroups = buildTierGroups(game, selection);
    if (!tierGroups.length) {
      const emptyCopy = state.cfg.copy.emptyResults || "No curated CPU and GPU starting points match this game profile yet.";
      setStatus(ui, emptyCopy, "empty");
      if (ui.recommendations) {
        ui.recommendations.hidden = true;
        ui.recommendations.innerHTML = "";
      }
      ui.results.innerHTML = `<div class="ucp-fpsf__empty">${escapeHtml(emptyCopy)}</div>`;
      if (ui.compare) {
        ui.compare.hidden = true;
        ui.compare.innerHTML = "";
      }
      return;
    }

    setStatus(ui, "", "ready");
    renderRecommendationLayer(state, ui, selection);
    ui.results.innerHTML = tierGroups.map((group) => renderTierGroup(group, state.cfg)).join("");
    renderCompare(state, ui, game, gameBenchmarks, selection);
  }

  function renderSelectedGame(game, ui) {
    const metaParts = [];
    if (game.genre) metaParts.push(game.genre);
    if (game.profile.profileKey) metaParts.push(`Profile: ${game.profile.profileKey}`);
    const heroImageUrl = pickGameHeroImage(game);
    const heroChips = [];
    if (game.genre) heroChips.push(`<span class="ucp-fpsf__selected-chip">${escapeHtml(game.genre)}</span>`);
    if (game.profile.profileKey) {
      heroChips.push(`<span class="ucp-fpsf__selected-chip ucp-fpsf__selected-chip--accent">Profile ${escapeHtml(game.profile.profileKey)}</span>`);
    }
    const heroChipMarkup = heroChips.length ? `<div class="ucp-fpsf__selected-chip-row">${heroChips.join("")}</div>` : "";

    ui.selectedGame.hidden = false;
    ui.selectedGame.innerHTML = `
      <div class="ucp-fpsf__selected-stage">
        <div class="ucp-fpsf__selected-media${heroImageUrl ? "" : " is-empty"}">
          ${heroImageUrl ? `<img class="ucp-fpsf__selected-banner" src="${escapeAttribute(heroImageUrl)}" alt="${escapeAttribute(game.name)} artwork">` : '<div class="ucp-fpsf__selected-banner-fallback" aria-hidden="true"></div>'}
        </div>
        <div class="ucp-fpsf__selected-glow" aria-hidden="true"></div>
        <div class="ucp-fpsf__selected-content">
          <div class="ucp-fpsf__selected-topline">
            ${game.iconUrl ? `<img class="ucp-fpsf__selected-icon" src="${escapeAttribute(game.iconUrl)}" alt="${escapeAttribute(game.name)}">` : '<div class="ucp-fpsf__selected-icon" aria-hidden="true"></div>'}
            ${heroChipMarkup}
          </div>
          <p class="ucp-fpsf__selected-kicker">Benchmark-backed game finder</p>
          <p class="ucp-fpsf__selected-name">${escapeHtml(game.name)}</p>
          <p class="ucp-fpsf__selected-meta">${escapeHtml(metaParts.join(" | ") || "Author-controlled FPS profile")}</p>
        </div>
      </div>
    `;
  }

  function pickGameHeroImage(game) {
    // Banner is the storefront's authored hero surface. Fall back to the
    // existing background image so older game entries still render a stage.
    if (!game) return "";
    return stringOrEmpty(game.bannerUrl) || stringOrEmpty(game.backgroundImageUrl);
  }

  function renderResolutions(game, state, ui) {
    const allowed = Array.isArray(game?.profile?.allowedResolutions) ? game.profile.allowedResolutions : [];
    ui.resolutions.innerHTML = allowed
      .map((resolution) => {
        const meta = RESOLUTION_META[resolution] || { label: resolution };
        const activeClass = resolution === state.selectedResolution ? " is-active" : "";
        return `<button type="button" class="ucp-fpsf__resolution${activeClass}" data-resolution="${escapeAttribute(resolution)}">${escapeHtml(meta.label)}</button>`;
      })
      .join("");
  }

  function renderPresets(game, state, ui) {
    if (!ui.presets) return;
    const activePreset = normalizePresetKey(state.selectedPreset) || getDefaultPreset(game);
    ui.presets.innerHTML = PRESET_ORDER
      .map((preset) => {
        const meta = PRESET_META[preset] || { label: humanizeToken(preset) };
        const activeClass = preset === activePreset ? " is-active" : "";
        return `<button type="button" class="ucp-fpsf__preset${activeClass}" data-preset="${escapeAttribute(preset)}">${escapeHtml(meta.label)}</button>`;
      })
      .join("");
  }

  function renderNotes(game, state, ui) {
    const noteParts = [];
    if (game.profile.notesShort) noteParts.push(game.profile.notesShort);

    const resBias = game.profile.biases?.[state.selectedResolution];
    if (resBias) noteParts.push(resBias);

    if (!noteParts.length) {
      ui.note.hidden = true;
      ui.note.textContent = "";
      return;
    }

    ui.note.hidden = false;
    ui.note.textContent = noteParts.join(" ");
  }

  function buildTierGroups(game, selection) {
    const candidates = Array.isArray(selection?.candidates) ? selection.candidates : [];
    if (!candidates.length) return [];

    const cardsByTier = new Map(TIER_ORDER.map((tierId) => [tierId, new Map()]));

    for (const candidate of candidates) {
      cardsByTier.get(candidate.tierId).set(candidate.comboKey, candidate);
    }

    return TIER_ORDER.map((tierId) => {
      const cards = Array.from(cardsByTier.get(tierId).values()).sort(compareRecommendation);
      if (!cards.length) return null;

      return {
        tierId,
        tier: game.profile.tiers[tierId],
        cards: pickTierCards(cards)
      };
    }).filter(Boolean);
  }

  function buildSelectionCandidates(state, game, gameBenchmarks, resolutionOverride) {
    const resolution = normalizeResolutionKey(resolutionOverride || state.selectedResolution);
    if (!resolution) {
      return { resolution: "", preset: "", thresholds: null, candidates: [] };
    }

    const thresholds = game.profile?.thresholds?.[resolution];
    if (!thresholds) {
      return { resolution, preset: "", thresholds: null, candidates: [] };
    }

    const preset = normalizePresetKey(state.selectedPreset) || getDefaultPreset(game);
    const candidatesByCombo = new Map();

    for (const row of Array.isArray(gameBenchmarks) ? gameBenchmarks : []) {
      if (row.gameKey !== game.key) continue;
      if (row.resolution !== resolution) continue;
      if (preset && row.preset !== preset) continue;

      // Thresholds are authored as ascending experience bands. A stronger combo
      // only belongs to the highest tier whose minimum FPS it clears.
      const tierId = classifyTier(row.avg, thresholds);
      if (!tierId) continue;

      const cpuOptions = state.cpuIndex.get(row.cpuBenchHandle) || [];
      const gpuOptions = state.gpuIndex.get(row.gpuBenchHandle) || [];
      if (!cpuOptions.length || !gpuOptions.length) continue;

      // Curate at the benchmark-handle level, not at the retail SKU level.
      // Each tier should surface one clear CPU + GPU starting point, so we map
      // every handle pair to the cheapest live CPU and GPU entries that carry
      // those canonical benchmark handles.
      const cpu = pickCuratedPartEntry(cpuOptions);
      const gpu = pickCuratedPartEntry(gpuOptions);
      const candidate = createRecommendationCandidate(game, tierId, resolution, row, cpu, gpu, thresholds);
      if (!candidate) continue;

      const current = candidatesByCombo.get(candidate.comboKey);
      if (!current || compareRecommendation(candidate, current) < 0) {
        candidatesByCombo.set(candidate.comboKey, candidate);
      }
    }

    return {
      resolution,
      preset,
      thresholds,
      candidates: Array.from(candidatesByCombo.values())
    };
  }

  function buildTopRecommendations(cfg, selection) {
    const candidates = Array.isArray(selection?.candidates) ? selection.candidates : [];
    if (!candidates.length) return [];

    const slotLaneIds = normalizeTopRecommendationSlots(cfg?.topRecommendationSlots);
    if (!slotLaneIds.length) return [];

    const priceQualifiedCandidates = candidates.filter(hasRankablePrice);
    const requestedLaneIds = new Set(slotLaneIds);
    const laneOutcomes = buildTopRecommendationOutcomes(
      cfg,
      selection,
      priceQualifiedCandidates,
      candidates,
      requestedLaneIds
    );
    const usedComboKeys = new Set();

    return slotLaneIds
      .map((laneId) => {
        const outcome = laneOutcomes.get(laneId);
        if (!outcome?.primaryCard) return null;

        const laneSelection = pickTopRecommendationCard(outcome, usedComboKeys);
        const card = laneSelection?.card;
        if (!card) return null;

        if (card.comboKey) usedComboKeys.add(card.comboKey);

        return {
          laneId,
          title: getTopRecommendationTitle(laneId),
          card,
          rationale: getTopRecommendationRationale(laneId, outcome, laneSelection)
        };
      })
      .filter(Boolean);
  }

  function buildTopRecommendationOutcomes(cfg, selection, priceQualifiedCandidates, allCandidates, requestedLaneIds) {
    const requested = requestedLaneIds instanceof Set ? requestedLaneIds : new Set();
    const outcomes = new Map();
    const needsBestValueReference =
      requested.has("best_value") ||
      requested.has("best_starting_point") ||
      requested.has("better_upgrade_path");
    const bestValueOutcome = needsBestValueReference
      ? resolveBestValueRecommendation(priceQualifiedCandidates, allCandidates)
      : null;
    const bestValueCard = bestValueOutcome?.primaryCard || null;

    if (requested.has("best_budget")) {
      outcomes.set(
        "best_budget",
        resolveBestBudgetRecommendation(priceQualifiedCandidates, allCandidates, selection?.thresholds)
      );
    }

    if (requested.has("best_value") && bestValueOutcome) {
      outcomes.set("best_value", bestValueOutcome);
    }

    if (requested.has("best_starting_point")) {
      outcomes.set(
        "best_starting_point",
        resolveBestStartingRecommendation(priceQualifiedCandidates, allCandidates, bestValueCard, cfg.thresholds)
      );
    }

    if (requested.has("better_upgrade_path")) {
      outcomes.set(
        "better_upgrade_path",
        resolveUpgradePathRecommendation(priceQualifiedCandidates, allCandidates, bestValueCard)
      );
    }

    return outcomes;
  }

  function pickTopRecommendationCard(outcome, usedComboKeys) {
    const rankedCards = Array.isArray(outcome?.rankedCards) ? outcome.rankedCards.filter(Boolean) : [];
    if (!rankedCards.length) return null;

    const used = usedComboKeys instanceof Set ? usedComboKeys : new Set();
    const distinctCard = rankedCards.find((candidate) => candidate?.comboKey && !used.has(candidate.comboKey));
    const card = distinctCard || rankedCards[0];

    return {
      card,
      isPrimary: Boolean(card?.comboKey && card.comboKey === outcome?.primaryCard?.comboKey)
    };
  }

  function getTopRecommendationTitle(laneId) {
    if (laneId === "best_budget") return "Best Budget";
    if (laneId === "best_value") return "Best Value";
    if (laneId === "best_starting_point") return "Best Starting Point";
    return "Better Upgrade Path";
  }

  function resolveBestBudgetRecommendation(priceQualifiedCandidates, allCandidates, thresholds) {
    const priceQualified = Array.isArray(priceQualifiedCandidates) ? priceQualifiedCandidates : [];
    const tierFloor = getTierMinimum(thresholds, "tier_1");
    const rankedPriceQualified = [...priceQualified].sort(compareBestBudgetRecommendation);

    if (Number.isFinite(tierFloor)) {
      const rankedQualifying = rankedPriceQualified
        .filter((candidate) => toFiniteNumber(candidate?.avg) >= tierFloor);

      if (rankedQualifying.length) {
        return {
          primaryCard: rankedQualifying[0],
          rankedCards: rankedQualifying,
          rationaleKey: "tier-floor-qualified"
        };
      }

      if (rankedPriceQualified.length) {
        return {
          primaryCard: rankedPriceQualified[0],
          rankedCards: rankedPriceQualified,
          rationaleKey: "tier-floor-unreachable"
        };
      }
    }

    if (rankedPriceQualified.length) {
      return {
        primaryCard: rankedPriceQualified[0],
        rankedCards: rankedPriceQualified,
        rationaleKey: "missing-tier-floor"
      };
    }

    const strongestFallback = [...(Array.isArray(allCandidates) ? allCandidates : [])].sort(compareStrongerRecommendation);
    return {
      primaryCard: strongestFallback[0] || null,
      rankedCards: strongestFallback,
      rationaleKey: "price-fallback"
    };
  }

  function resolveBestValueRecommendation(priceQualifiedCandidates, allCandidates) {
    // Best Value is now determined by FPS per peso, not by the lowest absolute
    // price. The formula is avg FPS divided by the combined CPU + GPU start price.
    const ranked = [...(Array.isArray(priceQualifiedCandidates) ? priceQualifiedCandidates : [])].sort(compareBestValueRecommendation);
    if (ranked.length) {
      return {
        primaryCard: ranked[0],
        rankedCards: ranked,
        rationaleKey: "fps-per-peso"
      };
    }

    const rankedFallback = [...(Array.isArray(allCandidates) ? allCandidates : [])].sort(compareStrongerRecommendation);
    return {
      // If price data is malformed we still show a safe benchmark-backed fallback
      // instead of making the recommendation layer disappear.
      primaryCard: rankedFallback[0] || null,
      rankedCards: rankedFallback,
      rationaleKey: "price-fallback"
    };
  }

  function resolveBestStartingRecommendation(priceQualifiedCandidates, allCandidates, bestValueCard, thresholds) {
    if (!bestValueCard) {
      const rankedFallback = [...(Array.isArray(allCandidates) ? allCandidates : [])].sort(compareStrongerRecommendation);
      return {
        primaryCard: rankedFallback[0] || null,
        rankedCards: rankedFallback,
        rationaleKey: "price-fallback"
      };
    }

    if (!hasRankablePrice(bestValueCard)) {
      const rankedFallback = [...(Array.isArray(allCandidates) ? allCandidates : [])]
        .filter((candidate) => candidate.comboKey !== bestValueCard.comboKey)
        .sort(compareStrongerRecommendation);
      const rankedCards = rankedFallback.length ? rankedFallback : [bestValueCard];
      return {
        primaryCard: rankedCards[0] || null,
        rankedCards,
        rationaleKey: "price-fallback"
      };
    }

    const minGainRatio = Number.isFinite(thresholds?.bestStartingMinFpsGainRatio)
      ? thresholds.bestStartingMinFpsGainRatio
      : 0.1;
    const maxPriceIncreaseRatio = Number.isFinite(thresholds?.bestStartingMaxPriceIncreaseRatio)
      ? thresholds.bestStartingMaxPriceIncreaseRatio
      : 0.2;

    // Best Starting Point stays configurable by section settings so the merchant
    // can tune the step-up behavior without rewriting the selection algorithm.
    const qualified = (Array.isArray(priceQualifiedCandidates) ? priceQualifiedCandidates : [])
      .filter((candidate) => candidate.comboKey !== bestValueCard.comboKey)
      .filter((candidate) => candidate.avg >= bestValueCard.avg * (1 + minGainRatio))
      .filter((candidate) => candidate.totalPrice <= bestValueCard.totalPrice * (1 + maxPriceIncreaseRatio))
      .sort(compareBestStartingRecommendation);

    if (qualified.length) {
      return {
        primaryCard: qualified[0],
        rankedCards: qualified,
        rationaleKey: "qualified-step-up"
      };
    }

    return {
      primaryCard: bestValueCard,
      rankedCards: [bestValueCard],
      rationaleKey: "fallback-to-best-value"
    };
  }

  function resolveUpgradePathRecommendation(priceQualifiedCandidates, allCandidates, bestValueCard) {
    const priceQualified = Array.isArray(priceQualifiedCandidates) ? priceQualifiedCandidates : [];

    if (bestValueCard?.cpuPlatformLabel === "AM4") {
      const am5Candidates = priceQualified
        .filter((candidate) => candidate.comboKey !== bestValueCard.comboKey)
        .filter((candidate) => candidate.cpuPlatformLabel === "AM5")
        .filter((candidate) => {
          if (!hasRankablePrice(bestValueCard) || !hasRankablePrice(candidate)) return true;
          return candidate.totalPrice <= bestValueCard.totalPrice * (1 + UPGRADE_PATH_MAX_PRICE_JUMP_RATIO);
        })
        .sort(compareUpgradePathRecommendation);

      if (am5Candidates.length) {
        return {
          primaryCard: am5Candidates[0],
          rankedCards: am5Candidates,
          rationaleKey: "am5-upgrade-path"
        };
      }
    }

    const rankedFallback = [...(Array.isArray(allCandidates) ? allCandidates : [])]
      .filter((candidate) => candidate.comboKey !== bestValueCard?.comboKey)
      .sort(compareStrongerRecommendation);
    if (rankedFallback.length) {
      return {
        primaryCard: rankedFallback[0],
        rankedCards: rankedFallback,
        rationaleKey: bestValueCard?.cpuPlatformLabel === "AM5"
          ? "current-platform-already-strong"
          : "strongest-alternate"
      };
    }

    const duplicateFallback = bestValueCard ? [bestValueCard] : [...(Array.isArray(allCandidates) ? allCandidates : [])].sort(compareStrongerRecommendation);
    return {
      primaryCard: duplicateFallback[0] || null,
      rankedCards: duplicateFallback,
      rationaleKey: bestValueCard?.cpuPlatformLabel === "AM5"
        ? "current-platform-already-strong"
        : "fallback-duplicate"
    };
  }

  function pickTierCards(cards) {
    if (!Array.isArray(cards) || !cards.length) return [];

    const primary = { ...cards[0], isTierFloor: true };
    const alternate = cards.slice(1).find((candidate) => isMeaningfulAlternate(primary, candidate));
    if (!alternate) return [primary];

    return [
      primary,
      { ...alternate, isTierAlternate: true }
    ];
  }

  function pickCuratedPartEntry(entries) {
    return Array.isArray(entries) && entries.length ? entries[0] : null;
  }

  function isMeaningfulAlternate(primary, candidate) {
    if (!primary || !candidate) return false;
    if (candidate.comboKey === primary.comboKey) return false;

    const fpsGainRatio = primary.avg > 0 ? (candidate.avg - primary.avg) / primary.avg : 0;
    const priceJumpRatio = primary.totalPrice > 0 ? (candidate.totalPrice - primary.totalPrice) / primary.totalPrice : 0;

    // Alternates should feel meaningfully different for the shopper, not like
    // another board-partner duplicate with the same performance story.
    if (fpsGainRatio < ALTERNATE_MIN_FPS_GAIN_RATIO) return false;
    if (priceJumpRatio > ALTERNATE_MAX_PRICE_JUMP_RATIO) return false;

    return candidate.cpuBenchHandle !== primary.cpuBenchHandle || candidate.gpuBenchHandle !== primary.gpuBenchHandle;
  }

  function createRecommendationCandidate(game, tierId, resolution, row, cpu, gpu, thresholds) {
    const cpuPrice = toFiniteNumber(cpu?.variant?.price);
    const gpuPrice = toFiniteNumber(gpu?.variant?.price);
    if (!cpu?.variant?.id || !gpu?.variant?.id) return null;

    const thresholdMin = getTierMinimum(thresholds, tierId);
    const headroom = Number.isFinite(thresholdMin) ? Math.max(0, row.avg - thresholdMin) : row.avg;
    const totalPrice = Number.isFinite(cpuPrice) && Number.isFinite(gpuPrice)
      ? cpuPrice + gpuPrice
      : null;

    return {
      comboKey: [game.key, resolution, tierId, row.cpuBenchHandle, row.gpuBenchHandle].join("|"),
      cpuBenchHandle: row.cpuBenchHandle,
      gpuBenchHandle: row.gpuBenchHandle,
      tierId,
      tier: game.profile.tiers[tierId],
      resolution,
      preset: row.preset,
      avg: row.avg,
      headroom,
      totalPrice,
      // Best Value ranks by avg FPS divided by the live mapped CPU + GPU price.
      fpsPerPeso: Number.isFinite(totalPrice) && totalPrice > 0 ? row.avg / totalPrice : null,
      cpu,
      gpu,
      cpuPlatformLabel: stringOrEmpty(cpu?.platformLabel),
      isPurchasable: Boolean(cpu.variant.available && gpu.variant.available)
    };
  }

  function compareRecommendation(left, right) {
    const byPrice = comparePricesAscending(left?.totalPrice, right?.totalPrice);
    if (byPrice !== 0) return byPrice;
    if (left.headroom !== right.headroom) return left.headroom - right.headroom;

    const byAvailability = compareAvailabilityDescending(left, right);
    if (byAvailability !== 0) return byAvailability;

    const byAvg = compareAverageDescending(left, right);
    if (byAvg !== 0) return byAvg;

    const byCpu = stringOrEmpty(left.cpu?.title).localeCompare(stringOrEmpty(right.cpu?.title));
    if (byCpu !== 0) return byCpu;

    return stringOrEmpty(left.gpu?.title).localeCompare(stringOrEmpty(right.gpu?.title));
  }

  function compareBestValueRecommendation(left, right) {
    const leftValue = getFpsPerPeso(left);
    const rightValue = getFpsPerPeso(right);

    if (leftValue !== rightValue) return rightValue - leftValue;

    const byPrice = comparePricesAscending(left?.totalPrice, right?.totalPrice);
    if (byPrice !== 0) return byPrice;

    const byAvg = compareAverageDescending(left, right);
    if (byAvg !== 0) return byAvg;

    const byAvailability = compareAvailabilityDescending(left, right);
    if (byAvailability !== 0) return byAvailability;

    return compareRecommendation(left, right);
  }

  function compareBestStartingRecommendation(left, right) {
    const byPrice = comparePricesAscending(left?.totalPrice, right?.totalPrice);
    if (byPrice !== 0) return byPrice;

    const byAvg = compareAverageDescending(left, right);
    if (byAvg !== 0) return byAvg;

    const byAvailability = compareAvailabilityDescending(left, right);
    if (byAvailability !== 0) return byAvailability;

    const byPlatform = comparePlatformDescending(left, right);
    if (byPlatform !== 0) return byPlatform;

    return compareRecommendation(left, right);
  }

  function compareBestBudgetRecommendation(left, right) {
    const byPrice = comparePricesAscending(left?.totalPrice, right?.totalPrice);
    if (byPrice !== 0) return byPrice;

    const byAvg = compareAverageDescending(left, right);
    if (byAvg !== 0) return byAvg;

    const byAvailability = compareAvailabilityDescending(left, right);
    if (byAvailability !== 0) return byAvailability;

    return compareRecommendation(left, right);
  }

  function compareUpgradePathRecommendation(left, right) {
    const byPlatform = comparePlatformDescending(left, right);
    if (byPlatform !== 0) return byPlatform;

    const byAvg = compareAverageDescending(left, right);
    if (byAvg !== 0) return byAvg;

    const byPrice = comparePricesAscending(left?.totalPrice, right?.totalPrice);
    if (byPrice !== 0) return byPrice;

    const byAvailability = compareAvailabilityDescending(left, right);
    if (byAvailability !== 0) return byAvailability;

    return compareRecommendation(left, right);
  }

  function compareStrongerRecommendation(left, right) {
    const byAvg = compareAverageDescending(left, right);
    if (byAvg !== 0) return byAvg;

    const byPrice = comparePricesAscending(left?.totalPrice, right?.totalPrice);
    if (byPrice !== 0) return byPrice;

    const byAvailability = compareAvailabilityDescending(left, right);
    if (byAvailability !== 0) return byAvailability;

    const byPlatform = comparePlatformDescending(left, right);
    if (byPlatform !== 0) return byPlatform;

    return compareRecommendation(left, right);
  }

  function comparePricesAscending(leftPrice, rightPrice) {
    const left = toFiniteNumber(leftPrice);
    const right = toFiniteNumber(rightPrice);
    const leftValid = Number.isFinite(left);
    const rightValid = Number.isFinite(right);

    if (leftValid && rightValid && left !== right) return left - right;
    if (leftValid !== rightValid) return leftValid ? -1 : 1;
    return 0;
  }

  function compareAverageDescending(left, right) {
    const leftAvg = toFiniteNumber(left?.avg);
    const rightAvg = toFiniteNumber(right?.avg);
    if (Number.isFinite(leftAvg) && Number.isFinite(rightAvg) && leftAvg !== rightAvg) {
      return rightAvg - leftAvg;
    }
    return 0;
  }

  function compareAvailabilityDescending(left, right) {
    return Number(Boolean(right?.isPurchasable)) - Number(Boolean(left?.isPurchasable));
  }

  function comparePlatformDescending(left, right) {
    return getPlatformRank(right?.cpuPlatformLabel) - getPlatformRank(left?.cpuPlatformLabel);
  }

  function hasRankablePrice(candidate) {
    const totalPrice = toFiniteNumber(candidate?.totalPrice);
    return Number.isFinite(totalPrice) && totalPrice > 0;
  }

  function getFpsPerPeso(candidate) {
    const value = toFiniteNumber(candidate?.fpsPerPeso);
    return Number.isFinite(value) ? value : -Infinity;
  }

  function renderRecommendationLayer(state, ui, selection) {
    if (!ui.recommendations) return;

    const recommendations = buildTopRecommendations(state.cfg, selection);
    if (!recommendations.length) {
      ui.recommendations.hidden = true;
      ui.recommendations.innerHTML = "";
      return;
    }

    ui.recommendations.hidden = false;
    ui.recommendations.innerHTML = `
      <section class="ucp-fpsf__recommendation-layer">
        <div class="ucp-fpsf__recommendation-intro">
          <p class="ucp-fpsf__recommendation-eyebrow">Recommended first clicks</p>
          <p class="ucp-fpsf__recommendation-subtitle">Three configurable benchmark-backed shortcuts to help shoppers decide faster before they browse the tier sections.</p>
        </div>
        <div class="ucp-fpsf__recommendation-grid">
          ${recommendations.map((entry) => renderTopRecommendationCard(entry, state.cfg)).join("")}
        </div>
      </section>
    `;
  }

  function renderTopRecommendationCard(entry, cfg) {
    const card = entry?.card;
    if (!card) return "";

    const disableForAvailability = cfg.disableCtaWhenUnavailable && !card.isPurchasable;
    const href = disableForAvailability ? "" : buildBuilderUrl(cfg.builderPageUrl, card.cpu.variant.id, card.gpu.variant.id);
    const ctaLabel = href
      ? "Open in PC Builder"
      : disableForAvailability
        ? "Temporarily unavailable"
        : "Builder link unavailable";

    const summaryChips = [
      `<span class="ucp-fpsf__summary-chip">${escapeHtml(buildAvailabilitySummary(card))}</span>`
    ];

    if (card.cpuPlatformLabel) {
      summaryChips.push(`<span class="ucp-fpsf__summary-chip ucp-fpsf__summary-chip--platform">Platform: ${escapeHtml(card.cpuPlatformLabel)}</span>`);
    }

    if (!card.isPurchasable) {
      summaryChips.push('<span class="ucp-fpsf__summary-chip ucp-fpsf__summary-chip--warn">Currently unavailable</span>');
    }

    return `
      <article class="ucp-fpsf__card ucp-fpsf__card--top${card.isPurchasable ? "" : " is-unavailable"}">
        <div class="ucp-fpsf__card-head ucp-fpsf__card-head--top">
          <div>
            <p class="ucp-fpsf__lane-label">${escapeHtml(entry.title)}</p>
            <p class="ucp-fpsf__recommendation-rationale">${escapeHtml(entry.rationale)}</p>
          </div>
          <div class="ucp-fpsf__card-flags ucp-fpsf__card-flags--top">${summaryChips.join("")}</div>
        </div>

        <div class="ucp-fpsf__metrics">
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">Average FPS</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatFps(card.avg))}</span>
          </div>
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">CPU + GPU starting price</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatMoney(card.totalPrice))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__parts">
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">CPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(card.cpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(getPartStatus(card.cpu))}</span>
          </div>
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">GPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(card.gpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(getPartStatus(card.gpu))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__card-actions">
          <a class="ucp-fpsf__cta" href="${escapeAttribute(href || "#")}"${renderBuilderCtaTrackingAttributes("fps_finder_recommendation_builder", href)}${href ? "" : ' aria-disabled="true"'}>${escapeHtml(ctaLabel)}</a>
          <button
            type="button"
            class="ucp-fpsf__compare-trigger"
            data-compare-combo="${escapeAttribute(card.comboKey)}"
            data-compare-cpu="${escapeAttribute(card.cpuBenchHandle)}"
            data-compare-gpu="${escapeAttribute(card.gpuBenchHandle)}"
          >
            Compare another combo
          </button>
        </div>
      </article>
    `;
  }

  function getTopRecommendationRationale(laneId, outcome, laneSelection) {
    const key = stringOrEmpty(outcome?.rationaleKey);
    const isPrimary = laneSelection?.isPrimary !== false;

    if (!isPrimary) {
      if (laneId === "best_budget") {
        return "Another low-cost mapped option from the same budget-first ranking because an earlier slot already used the top combo.";
      }
      if (laneId === "best_value") {
        return "Another strong FPS-per-peso option from the same value ranking because an earlier slot already used the top combo.";
      }
      if (laneId === "best_starting_point") {
        return "Another step-up option from the same starting-point ranking because an earlier slot already used the top combo.";
      }
      return "Another upgrade-oriented option from the same platform-forward ranking because an earlier slot already used the top combo.";
    }

    if (laneId === "best_budget") {
      if (key === "tier-floor-unreachable") {
        return "No mapped combo currently clears the first FPS target, so this shows the cheapest benchmark-backed option for the current context.";
      }
      if (key === "missing-tier-floor") {
        return "No first-tier FPS floor is authored for this context, so this shows the cheapest mapped combo instead.";
      }
      if (key === "price-fallback") {
        return "Price data is incomplete, so this falls back to the strongest benchmark-backed starting point.";
      }
      return "Lowest-priced mapped combo that already clears the first FPS target for this game, resolution, and preset.";
    }

    if (laneId === "best_value") {
      if (key === "price-fallback") {
        return "Price data is incomplete, so this falls back to the strongest benchmark-backed starting point.";
      }
      return "Best FPS-per-peso benchmark-backed starting point for this game, resolution, and preset.";
    }

    if (laneId === "best_starting_point") {
      if (key === "qualified-step-up") {
        return "Better first recommendation with more FPS headroom for a modest price step-up.";
      }
      if (key === "price-fallback") {
        return "Price data is incomplete, so this falls back to the strongest sensible benchmark-backed step-up.";
      }
      return "No separate step-up currently clears the configured FPS and price targets, so this matches Best Value.";
    }

    if (key === "am5-upgrade-path") {
      return "Newer AM5 platform option with more upgrade room when you want a better long-term base.";
    }
    if (key === "current-platform-already-strong") {
      return "The current result set already centers on the stronger platform, so this shows the best alternate path.";
    }
    if (key === "strongest-alternate") {
      return "Stronger benchmark-backed alternate when a clearer newer-platform path is not available.";
    }
    return "Current result set does not expose a clearer platform-forward step-up, so this falls back safely.";
  }

  function buildAvailabilitySummary(card) {
    const cpuStatus = getPartStatus(card?.cpu);
    const gpuStatus = getPartStatus(card?.gpu);
    if (cpuStatus && gpuStatus && cpuStatus === gpuStatus) {
      return `Availability: ${cpuStatus}`;
    }
    return `Availability: CPU ${cpuStatus || "Unknown"} / GPU ${gpuStatus || "Unknown"}`;
  }

  function getTierMinimum(thresholds, tierId) {
    if (!thresholds) return NaN;
    if (tierId === "tier_1") return toFiniteNumber(thresholds.tier_1_min);
    if (tierId === "tier_2") return toFiniteNumber(thresholds.tier_2_min);
    if (tierId === "tier_3") return toFiniteNumber(thresholds.tier_3_min);
    return NaN;
  }

  function classifyTier(avg, thresholds) {
    const tier1 = toFiniteNumber(thresholds?.tier_1_min);
    const tier2 = toFiniteNumber(thresholds?.tier_2_min);
    const tier3 = toFiniteNumber(thresholds?.tier_3_min);

    if (!Number.isFinite(avg)) return "";
    if (Number.isFinite(tier3) && avg >= tier3) return "tier_3";
    if (Number.isFinite(tier2) && avg >= tier2 && (!Number.isFinite(tier3) || avg < tier3)) return "tier_2";
    if (Number.isFinite(tier1) && avg >= tier1 && (!Number.isFinite(tier2) || avg < tier2)) return "tier_1";
    return "";
  }

  function renderTierGroup(group, cfg) {
    return `
      <section class="ucp-fpsf__tier">
        <div class="ucp-fpsf__tier-intro">
          <div>
            <p class="ucp-fpsf__tier-label">${escapeHtml(group.tier.label)}</p>
            <p class="ucp-fpsf__tier-subtitle">Lowest qualifying combo first, plus one higher-headroom alternate when it is meaningfully different.</p>
          </div>
          <span class="ucp-fpsf__tier-key">${escapeHtml(group.tier.key)}</span>
        </div>
        <div class="ucp-fpsf__tier-grid">
          ${group.cards.map((card) => renderCard(card, cfg)).join("")}
        </div>
      </section>
    `;
  }

  function renderCard(card, cfg) {
    const disableForAvailability = cfg.disableCtaWhenUnavailable && !card.isPurchasable;
    const href = disableForAvailability ? "" : buildBuilderUrl(cfg.builderPageUrl, card.cpu.variant.id, card.gpu.variant.id);
    const ctaLabel = href
      ? "Open in PC Builder"
      : disableForAvailability
        ? "Temporarily unavailable"
        : "Builder link unavailable";
    const flags = [];

    if (card.isTierFloor) {
      flags.push('<span class="ucp-fpsf__flag ucp-fpsf__flag--primary">Lowest qualifying combo</span>');
    }

    if (card.isTierAlternate) {
      flags.push('<span class="ucp-fpsf__flag ucp-fpsf__flag--secondary">More headroom option</span>');
    }

    if (!card.isPurchasable) {
      flags.push('<span class="ucp-fpsf__flag ucp-fpsf__flag--warn">Currently unavailable</span>');
    }

    return `
      <article class="ucp-fpsf__card${card.isPurchasable ? "" : " is-unavailable"}">
        <div class="ucp-fpsf__card-head">
          <div class="ucp-fpsf__card-flags">${flags.join("")}</div>
        </div>

        <div class="ucp-fpsf__metrics">
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">Average FPS</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatFps(card.avg))}</span>
          </div>
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">CPU + GPU starting price</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatMoney(card.totalPrice))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__parts">
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">CPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(card.cpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(getPartStatus(card.cpu))}</span>
          </div>
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">GPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(card.gpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(getPartStatus(card.gpu))}</span>
          </div>
        </div>

        <a class="ucp-fpsf__cta" href="${escapeAttribute(href || "#")}"${renderBuilderCtaTrackingAttributes("fps_finder_tier_builder", href)}${href ? "" : ' aria-disabled="true"'}>${escapeHtml(ctaLabel)}</a>
        <button
          type="button"
          class="ucp-fpsf__compare-trigger"
          data-compare-combo="${escapeAttribute(card.comboKey)}"
          data-compare-cpu="${escapeAttribute(card.cpuBenchHandle)}"
          data-compare-gpu="${escapeAttribute(card.gpuBenchHandle)}"
        >
          Compare another combo
        </button>
      </article>
    `;
  }

  function renderCompare(state, ui, game, gameBenchmarks, selectionOverride) {
    if (!ui.compare) return;
    if (!state.compare.active) {
      ui.compare.hidden = true;
      ui.compare.innerHTML = "";
      return;
    }

    const selection = selectionOverride || buildSelectionCandidates(state, game, gameBenchmarks);
    const baseline = selection.candidates.find((candidate) => candidate.comboKey === state.compare.baselineComboKey);
    if (!baseline) {
      resetCompareState(state);
      ui.compare.hidden = true;
      ui.compare.innerHTML = "";
      return;
    }

    syncCompareSelection(state, selection.candidates, baseline);

    const cpuOptions = buildCompareOptions(selection.candidates, "cpu");
    const gpuOptions = buildCompareOptions(selection.candidates, "gpu");
    const compared = findCompareCandidate(
      selection.candidates,
      state.compare.cpuBenchHandle,
      state.compare.gpuBenchHandle
    );

    ui.compare.hidden = false;
    ui.compare.innerHTML = renderComparePanel({
      cfg: state.cfg,
      game,
      resolution: selection.resolution,
      preset: selection.preset,
      baseline,
      compared,
      compareState: state.compare,
      cpuOptions,
      gpuOptions
    });
  }

  function syncCompareSelection(state, candidates, baseline) {
    const availableCpuHandles = new Set(candidates.map((candidate) => candidate.cpuBenchHandle));
    const availableGpuHandles = new Set(candidates.map((candidate) => candidate.gpuBenchHandle));

    if (!availableCpuHandles.has(state.compare.cpuBenchHandle)) {
      state.compare.cpuBenchHandle = baseline.cpuBenchHandle;
    }

    if (!availableGpuHandles.has(state.compare.gpuBenchHandle)) {
      state.compare.gpuBenchHandle = baseline.gpuBenchHandle;
    }
  }

  function buildCompareOptions(candidates, role) {
    const optionsByHandle = new Map();

    for (const candidate of Array.isArray(candidates) ? candidates : []) {
      const entry = role === "cpu" ? candidate.cpu : candidate.gpu;
      const benchHandle = role === "cpu" ? candidate.cpuBenchHandle : candidate.gpuBenchHandle;
      if (!entry || !benchHandle) continue;

      const current = optionsByHandle.get(benchHandle);
      if (!current || compareVariantPrice(entry.variant, current.variant) < 0) {
        optionsByHandle.set(benchHandle, {
          benchHandle,
          title: entry.title,
          variant: entry.variant
        });
      }
    }

    return Array.from(optionsByHandle.values()).sort((left, right) => compareVariantPrice(left.variant, right.variant));
  }

  function findCompareCandidate(candidates, cpuBenchHandle, gpuBenchHandle) {
    let best = null;

    for (const candidate of Array.isArray(candidates) ? candidates : []) {
      if (candidate.cpuBenchHandle !== cpuBenchHandle) continue;
      if (candidate.gpuBenchHandle !== gpuBenchHandle) continue;
      if (!best || compareRecommendation(candidate, best) < 0) {
        best = candidate;
      }
    }

    return best;
  }

  function renderComparePanel(context) {
    const {
      cfg,
      game,
      resolution,
      preset,
      baseline,
      compared,
      compareState,
      cpuOptions,
      gpuOptions
    } = context;

    const meta = [game.name, humanizeToken(resolution), humanizeToken(preset)].filter(Boolean).join(" | ");
    const deltaMarkup = compared
      ? renderCompareDelta(baseline, compared)
      : `
        <div class="ucp-fpsf__compare-empty">
          No benchmark data exists for that exact CPU + GPU combination at this game, resolution, and preset yet.
        </div>
      `;

    return `
      <section class="ucp-fpsf__compare-shell">
        <div class="ucp-fpsf__compare-head">
          <div>
            <p class="ucp-fpsf__compare-eyebrow">Compare Against Current Recommendation</p>
            <h3 class="ucp-fpsf__compare-title">Try another benchmark-backed CPU + GPU combo</h3>
            <p class="ucp-fpsf__compare-meta">${escapeHtml(meta)}</p>
          </div>
          <div class="ucp-fpsf__compare-actions">
            <button
              type="button"
              class="ucp-fpsf__compare-action"
              data-compare-reset
              data-compare-cpu="${escapeAttribute(baseline.cpuBenchHandle)}"
              data-compare-gpu="${escapeAttribute(baseline.gpuBenchHandle)}"
            >
              Reset
            </button>
            <button type="button" class="ucp-fpsf__compare-action" data-compare-close>Close</button>
          </div>
        </div>

        <div class="ucp-fpsf__compare-controls">
          <label class="ucp-fpsf__field" for="ucp-fps-finder-compare-cpu">
            <span class="ucp-fpsf__label">Compare CPU</span>
            <select id="ucp-fps-finder-compare-cpu" class="ucp-fpsf__select" data-compare-cpu>
              ${cpuOptions.map((option) => renderCompareOption(option, compareState.cpuBenchHandle)).join("")}
            </select>
          </label>

          <label class="ucp-fpsf__field" for="ucp-fps-finder-compare-gpu">
            <span class="ucp-fpsf__label">Compare GPU</span>
            <select id="ucp-fps-finder-compare-gpu" class="ucp-fpsf__select" data-compare-gpu>
              ${gpuOptions.map((option) => renderCompareOption(option, compareState.gpuBenchHandle)).join("")}
            </select>
          </label>
        </div>

        <div class="ucp-fpsf__compare-grid">
          ${renderCompareCard("Current recommendation", baseline, cfg, true)}
          ${compared
            ? renderCompareCard("Compared combo", compared, cfg, false)
            : renderCompareMissingCard(compareState)}
        </div>

        ${deltaMarkup}
      </section>
    `;
  }

  function renderCompareOption(option, selectedHandle) {
    const selectedAttr = option.benchHandle === selectedHandle ? " selected" : "";
    return `<option value="${escapeAttribute(option.benchHandle)}"${selectedAttr}>${escapeHtml(option.title)} (${escapeHtml(formatMoney(option.variant.price))})</option>`;
  }

  function renderCompareCard(label, card, cfg, isBaseline) {
    const disableForAvailability = cfg.disableCtaWhenUnavailable && !card.isPurchasable;
    const href = disableForAvailability ? "" : buildBuilderUrl(cfg.builderPageUrl, card.cpu.variant.id, card.gpu.variant.id);
    const ctaLabel = href
      ? "Open in PC Builder"
      : disableForAvailability
        ? "Temporarily unavailable"
        : "Builder link unavailable";

    return `
      <article class="ucp-fpsf__compare-card${card.isPurchasable ? "" : " is-unavailable"}">
        <p class="ucp-fpsf__compare-card-label">${escapeHtml(label)}</p>
        <div class="ucp-fpsf__metrics">
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">Average FPS</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatFps(card.avg))}</span>
          </div>
          <div class="ucp-fpsf__metric">
            <span class="ucp-fpsf__metric-label">CPU + GPU starting price</span>
            <span class="ucp-fpsf__metric-value">${escapeHtml(formatMoney(card.totalPrice))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__parts">
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">CPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(card.cpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(getPartStatus(card.cpu))}</span>
          </div>
          <div class="ucp-fpsf__part">
            <span class="ucp-fpsf__part-label">GPU</span>
            <span class="ucp-fpsf__part-title">${escapeHtml(card.gpu.title)}</span>
            <span class="ucp-fpsf__part-meta">${escapeHtml(getPartStatus(card.gpu))}</span>
          </div>
        </div>

        <div class="ucp-fpsf__compare-card-meta">
          <span>${escapeHtml(card.tier.label)}</span>
          <span>${escapeHtml(humanizeToken(card.preset))}</span>
        </div>

        ${isBaseline
          ? '<span class="ucp-fpsf__compare-baseline">Reference recommendation</span>'
          : `<a class="ucp-fpsf__cta" href="${escapeAttribute(href || "#")}"${renderBuilderCtaTrackingAttributes("fps_finder_compare_card_builder", href)}${href ? "" : ' aria-disabled="true"'}>${escapeHtml(ctaLabel)}</a>`}
      </article>
    `;
  }

  function renderCompareMissingCard(compareState) {
    const comboLabel = [humanizeToken(compareState.cpuBenchHandle), humanizeToken(compareState.gpuBenchHandle)]
      .filter(Boolean)
      .join(" + ");

    return `
      <article class="ucp-fpsf__compare-card is-missing">
        <p class="ucp-fpsf__compare-card-label">Compared combo</p>
        <div class="ucp-fpsf__compare-empty">
          ${escapeHtml(comboLabel || "Selected combo")} has no benchmark row for this exact game, resolution, and preset yet.
        </div>
      </article>
    `;
  }

  function renderCompareDelta(baseline, compared) {
    const fpsDelta = compared.avg - baseline.avg;
    const baselinePrice = toFiniteNumber(baseline?.totalPrice);
    const comparedPrice = toFiniteNumber(compared?.totalPrice);
    const priceDelta = Number.isFinite(baselinePrice) && Number.isFinite(comparedPrice)
      ? comparedPrice - baselinePrice
      : null;
    const tierDelta = compared.tier.label === baseline.tier.label
      ? `Same tier: ${compared.tier.label}`
      : `${baseline.tier.label} to ${compared.tier.label}`;

    return `
      <div class="ucp-fpsf__compare-delta">
        <div class="ucp-fpsf__compare-delta-chip">
          <span class="ucp-fpsf__compare-delta-label">FPS delta</span>
          <span class="ucp-fpsf__compare-delta-value">${escapeHtml(formatSignedFps(fpsDelta))}</span>
        </div>
        <div class="ucp-fpsf__compare-delta-chip">
          <span class="ucp-fpsf__compare-delta-label">Price delta</span>
          <span class="ucp-fpsf__compare-delta-value">${escapeHtml(formatSignedMoney(priceDelta))}</span>
        </div>
        <div class="ucp-fpsf__compare-delta-chip">
          <span class="ucp-fpsf__compare-delta-label">Tier shift</span>
          <span class="ucp-fpsf__compare-delta-value">${escapeHtml(tierDelta)}</span>
        </div>
      </div>
    `;
  }

  function getPartStatus(entry) {
    const label = stringOrEmpty(entry?.variant?.leadTimeLabel || entry?.leadTimeLabel);
    if (label) return label;
    return entry?.variant?.available ? "Available" : "Unavailable";
  }

  function resolveBuilderBaseUrl(builderPageUrl) {
    const configured = stringOrEmpty(builderPageUrl);
    if (configured) return configured;

    // Keep the Theme Editor URL as the primary source of truth, but fall back to
    // the conventional builder page path so recommendation CTAs do not become
    // dead buttons when the setting is still blank.
    return "/pages/pc-builder-2";
  }

  function buildBuilderUrl(builderPageUrl, cpuVariantId, gpuVariantId) {
    if (!cpuVariantId || !gpuVariantId) return "";
    const builderBaseUrl = resolveBuilderBaseUrl(builderPageUrl);
    if (!builderBaseUrl) return "";

    // FPS Finder recommendation clicks remain stateless. The builder already knows
    // how to apply cpu/gpu URL params, so this handoff should not introduce quote routing.
    const url = new URL(builderBaseUrl, window.location.origin);
    url.searchParams.set("cpu", String(cpuVariantId));
    url.searchParams.set("gpu", String(gpuVariantId));
    url.searchParams.set("src", "fps_finder");
    carryCurrentTrackingParams(url);
    return url.toString();
  }

  function carryCurrentTrackingParams(url) {
    if (!(url instanceof URL)) return;

    const campaign = readCurrentTrackingParam(["campaign", "utm_campaign"]);
    const content = readCurrentTrackingParam(["content", "utm_content"]);

    if (campaign && !url.searchParams.get("campaign") && !url.searchParams.get("utm_campaign")) {
      url.searchParams.set("campaign", campaign);
    }

    if (content && !url.searchParams.get("content") && !url.searchParams.get("utm_content")) {
      url.searchParams.set("content", content);
    }
  }

  function readCurrentTrackingParam(names) {
    try {
      const params = new URLSearchParams(window.location.search || "");
      for (const name of names) {
        const value = stringOrEmpty(params.get(name));
        if (value) return value;
      }
    } catch (error) {
      return "";
    }
    return "";
  }

  function renderBuilderCtaTrackingAttributes(ctaName, href) {
    if (!href) return "";
    return ` data-ucp-track-click data-ucp-track-page-type="fps_finder" data-ucp-track-cta="${escapeAttribute(ctaName)}"`;
  }

  function setStatus(ui, message, stateName) {
    ui.status.textContent = message || "";
    ui.status.dataset.state = stateName || "ready";
  }

  function handleRuntimeError(state, ui, error) {
    console.error("[UCP][FPS Finder] Failed to boot", error);
    setStatus(
      ui,
      state?.cfg?.copy?.loadError || "FPS Finder could not load its data right now. Please try again.",
      "error"
    );
    if (ui.recommendations) {
      ui.recommendations.hidden = true;
      ui.recommendations.innerHTML = "";
    }
    ui.results.innerHTML = "";
    if (ui.compare) {
      ui.compare.hidden = true;
      ui.compare.innerHTML = "";
    }
  }

  function handleComponentCompareError(state, ui, error, pairKey = "pairB") {
    console.error("[UCP][FPS Finder] Failed to load component compare pair", error);
    const comparePairState = state.compare?.[pairKey];
    if (comparePairState) {
      comparePairState.loading = false;
      comparePairState.error = "The compare pair could not load right now. Please try another pair or try again.";
    }
    renderComponentCentric(state, ui);
  }

  function normalizeResolutionList(values) {
    return Array.from(
      new Set(
        (Array.isArray(values) ? values : [])
          .map((value) => normalizeResolutionKey(value))
          .filter(Boolean)
      )
    );
  }

  function percentSettingToRatio(value, fallbackPercent) {
    const percent = toFiniteNumber(value);
    if (Number.isFinite(percent)) return percent / 100;
    return fallbackPercent / 100;
  }

  function normalizeTopRecommendationSlots(values) {
    return DEFAULT_TOP_RECOMMENDATION_SLOTS.map((fallbackLane, index) => {
      const requestedLane = normalizeTopRecommendationLane(Array.isArray(values) ? values[index] : "");
      return requestedLane || fallbackLane;
    });
  }

  function normalizeFinderMode(value) {
    return stringOrEmpty(value) === "component_centric" ? "component_centric" : "game_centric";
  }

  function normalizeCompareBetaModalMode(value) {
    const raw = stringOrEmpty(value).toLowerCase().replace(/[\s-]+/g, "_");
    if (raw === COMPARE_BETA_MODAL_MODES.OFF) return raw;
    if (raw === COMPARE_BETA_MODAL_MODES.EVERY_PAGE_LOAD) return raw;
    if (raw === COMPARE_BETA_MODAL_MODES.ONCE_PER_SESSION) return raw;
    if (raw === COMPARE_BETA_MODAL_MODES.ONCE_PER_DEVICE) return raw;
    return COMPARE_BETA_MODAL_MODES.EVERY_PAGE_LOAD;
  }

  function normalizeTopRecommendationLane(value) {
    const raw = stringOrEmpty(value).toLowerCase().replace(/[\s-]+/g, "_");
    if (raw === "best_budget") return raw;
    if (raw === "best_value") return raw;
    if (raw === "best_starting_point") return raw;
    if (raw === "better_upgrade_path") return raw;
    return "";
  }

  function normalizeProcessorSocketList(values) {
    const source = Array.isArray(values) ? values : [values];
    return Array.from(
      new Set(
        source
          .map((value) => normalizeProcessorSocket(value))
          .filter(Boolean)
      )
    );
  }

  function normalizeProcessorSocket(value) {
    const raw = stringOrEmpty(value).toUpperCase().replace(/\s+/g, "");
    if (!raw) return "";
    if (raw === "AM4" || raw === "AM5") return raw;
    return raw;
  }

  function getPreferredPlatformLabel(processorSockets) {
    const sockets = Array.isArray(processorSockets) ? processorSockets : [];
    if (sockets.includes("AM5")) return "AM5";
    if (sockets.includes("AM4")) return "AM4";
    return stringOrEmpty(sockets[0]);
  }

  function getPlatformRank(platformLabel) {
    const label = normalizeProcessorSocket(platformLabel);
    if (label === "AM5") return 2;
    if (label === "AM4") return 1;
    return 0;
  }

  function syncPreset(state, forceDefault = false) {
    const game = state.gamesByKey.get(state.selectedGame);
    const current = normalizePresetKey(state.selectedPreset);
    if (!forceDefault && current) {
      state.selectedPreset = current;
      return;
    }
    state.selectedPreset = getDefaultPreset(game);
  }

  function getDefaultPreset(game) {
    const preset = normalizePresetKey(game?.profile?.defaultPreset);
    return PRESET_ORDER.includes(preset) ? preset : "medium";
  }

  function normalizeResolutionKey(value) {
    const raw = stringOrEmpty(value).toLowerCase();
    if (!raw) return "";
    if (raw === "1080p" || raw === "1080") return "1080p";
    if (raw === "1440p" || raw === "1440") return "1440p";
    if (raw === "4k" || raw === "2160p" || raw === "2160") return "4k";
    return raw;
  }

  function normalizePresetKey(value) {
    const raw = stringOrEmpty(value).toLowerCase();
    if (!raw) return "";
    if (raw === "med") return "medium";
    if (raw === "low" || raw === "medium" || raw === "high") return raw;
    return raw;
  }

  function normalizeToken(value, slug = true) {
    const raw = stringOrEmpty(value).toLowerCase();
    if (!raw) return "";
    return slug ? raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : raw;
  }

  function stringOrEmpty(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function resolveDefaultSetting(value, fallback, legacyValue = "") {
    const normalized = stringOrEmpty(value);
    if (!normalized || normalized === stringOrEmpty(legacyValue)) return fallback;
    return normalized;
  }

  function toFiniteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function formatFps(value) {
    const number = toFiniteNumber(value);
    if (!Number.isFinite(number)) return "N/A";
    return `${Math.round(number)} FPS`;
  }

  function formatSignedFps(value) {
    const number = toFiniteNumber(value);
    if (!Number.isFinite(number)) return "N/A";
    const rounded = Math.round(number);
    if (rounded > 0) return `+${rounded} FPS`;
    if (rounded < 0) return `${rounded} FPS`;
    return "0 FPS";
  }

  function formatMoney(value) {
    const number = toFiniteNumber(value);
    if (!Number.isFinite(number)) return "N/A";

    const currencyCode =
      window.Shopify?.currency?.active ||
      window.Shopify?.currency?.currency ||
      "PHP";

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode
      }).format(number);
    } catch (_) {
      return `${currencyCode} ${number.toFixed(2)}`;
    }
  }

  function formatSignedMoney(value) {
    const number = toFiniteNumber(value);
    if (!Number.isFinite(number)) return "N/A";
    const prefix = number > 0 ? "+" : "";
    return `${prefix}${formatMoney(number)}`;
  }

  function humanizeToken(value) {
    const s = stringOrEmpty(value);
    if (!s) return "";
    return s
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function resetCompareState(state) {
    state.compare.active = false;
    state.compare.baselineComboKey = "";
    state.compare.cpuBenchHandle = "";
    state.compare.gpuBenchHandle = "";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
