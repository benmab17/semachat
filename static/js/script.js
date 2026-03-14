(function () {
    const RDC_BOUNDS = [[-13.6, 12.0], [5.4, 31.5]];
    const DEFAULT_MAP_CENTER = [-3.2, 23.65];
    const DEFAULT_MAP_ZOOM = 6;
    const map = L.map("map", {
        minZoom: 5,
        maxBounds: RDC_BOUNDS,
        maxBoundsViscosity: 1
    }).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const V = {
        ENERGIE: { icon: "\u26A1", className: "pin-energie", label: "Énergie" },
        EAU: { icon: "\uD83D\uDCA7", className: "pin-eau", label: "Eau" },
        FRAIS: { icon: "\uD83D\uDCB8", className: "pin-frais", label: "Frais" },
        INFRA: { icon: "\uD83D\uDEE3", className: "pin-infra", label: "Infrastructure" },
        INSECURITE: { icon: "\uD83D\uDEE1", className: "pin-insecurite", label: "Sécurité" },
        CONSTITUTION: { icon: "\u2696", className: "pin-constitution", label: "Constitution" },
        POLITIQUE: { icon: "\uD83C\uDFDB", className: "pin-politique", label: "Politique" },
        RELIGION: { icon: "\u26EA", className: "pin-religion", label: "Religion" }
    };

    const REPORT_QUEUE_KEY = "semachat_report_queue_v1";
    const CIRCLE_RADIUS_KM = 2;
    const LOCAL_CHAT_RADIUS_M = 500;
    const REALTIME_RECONNECT_MS = 4000;
    const PROVINCE_AREAS = [
        { key: "KINSHASA", name: "Kinshasa", lat: -4.4419, lng: 15.2663, bounds: [[-4.62, 14.95], [-4.08, 15.62]] },
        { key: "KONGO_CENTRAL", name: "Kongo Central", lat: -5.8167, lng: 13.4833, bounds: [[-6.8, 12.0], [-4.35, 15.45]] },
        { key: "KWANGO", name: "Kwango", lat: -6.2, lng: 17.45, bounds: [[-8.4, 15.0], [-4.6, 18.9]] },
        { key: "KWILU", name: "Kwilu", lat: -5.04, lng: 18.82, bounds: [[-6.7, 16.0], [-4.2, 20.2]] },
        { key: "MAI_NDOMBE", name: "Mai-Ndombe", lat: -2.4, lng: 18.2, bounds: [[-5.3, 14.9], [-0.2, 19.8]] },
        { key: "EQUATEUR", name: "Équateur", lat: 0.05, lng: 18.27, bounds: [[-2.5, 16.0], [1.5, 21.2]] },
        { key: "MONGALA", name: "Mongala", lat: 1.87, lng: 21.05, bounds: [[0.1, 17.7], [3.8, 23.0]] },
        { key: "NORD_UBANGI", name: "Nord-Ubangi", lat: 4.28, lng: 21.02, bounds: [[2.0, 17.8], [5.3, 24.1]] },
        { key: "SUD_UBANGI", name: "Sud-Ubangi", lat: 3.25, lng: 19.77, bounds: [[0.2, 16.0], [3.9, 22.0]] },
        { key: "TSHUAPA", name: "Tshuapa", lat: -0.7, lng: 23.45, bounds: [[-2.1, 19.0], [1.3, 25.2]] },
        { key: "TSHOPO", name: "Tshopo", lat: 0.52, lng: 25.19, bounds: [[-1.5, 22.0], [3.2, 28.9]] },
        { key: "BAS_UELE", name: "Bas-Uélé", lat: 3.82, lng: 24.75, bounds: [[2.2, 23.0], [5.2, 28.0]] },
        { key: "HAUT_UELE", name: "Haut-Uélé", lat: 2.77, lng: 27.62, bounds: [[1.0, 26.0], [4.6, 30.9]] },
        { key: "ITURI", name: "Ituri", lat: 1.56, lng: 30.25, bounds: [[0.0, 28.2], [3.7, 31.5]] },
        { key: "NORD_KIVU", name: "Nord-Kivu", lat: -1.68, lng: 29.22, bounds: [[-2.6, 27.0], [1.2, 29.9]] },
        { key: "SUD_KIVU", name: "Sud-Kivu", lat: -2.51, lng: 28.86, bounds: [[-5.5, 27.3], [-1.0, 30.8]] },
        { key: "MANIEMA", name: "Maniema", lat: -2.95, lng: 26.25, bounds: [[-5.8, 24.0], [-1.0, 28.5]] },
        { key: "TANGANYIKA", name: "Tanganyika", lat: -6.75, lng: 29.1, bounds: [[-9.6, 27.0], [-4.5, 31.5]] },
        { key: "HAUT_LOMAMI", name: "Haut-Lomami", lat: -8.49, lng: 27.0, bounds: [[-10.8, 23.4], [-6.0, 27.9]] },
        { key: "LUALABA", name: "Lualaba", lat: -10.72, lng: 25.47, bounds: [[-11.8, 21.8], [-7.0, 25.8]] },
        { key: "HAUT_KATANGA", name: "Haut-Katanga", lat: -11.66, lng: 27.48, bounds: [[-13.6, 24.0], [-8.0, 29.8]] },
        { key: "KASAI", name: "Kasaï", lat: -6.13, lng: 22.52, bounds: [[-8.4, 19.0], [-4.8, 23.6]] },
        { key: "KASAI_CENTRAL", name: "Kasaï-Central", lat: -5.9, lng: 22.42, bounds: [[-7.5, 21.4], [-4.6, 24.5]] },
        { key: "KASAI_ORIENTAL", name: "Kasaï-Oriental", lat: -6.15, lng: 23.6, bounds: [[-7.1, 22.1], [-5.0, 25.5]] },
        { key: "LOMAMI", name: "Lomami", lat: -6.18, lng: 24.55, bounds: [[-8.8, 23.0], [-5.3, 26.1]] },
        { key: "SANKURU", name: "Sankuru", lat: -3.8, lng: 24.0, bounds: [[-5.5, 22.0], [-2.0, 26.2]] }
    ];
    const SEARCH_AREAS = [
        { key: "province-kinshasa", name: "Kinshasa", kind: "Province", provinceKey: "KINSHASA", lat: -4.4419, lng: 15.2663, bounds: [[-4.62, 14.95], [-4.08, 15.62]], zoom: 11 },
        { key: "province-haut-katanga", name: "Haut-Katanga", kind: "Province", provinceKey: "HAUT_KATANGA", lat: -11.66, lng: 27.48, bounds: [[-13.6, 24.0], [-8.0, 29.8]], zoom: 8 },
        { key: "province-nord-kivu", name: "Nord-Kivu", kind: "Province", provinceKey: "NORD_KIVU", lat: -1.68, lng: 29.22, bounds: [[-2.6, 27.0], [1.2, 29.9]], zoom: 8 },
        { key: "province-sud-kivu", name: "Sud-Kivu", kind: "Province", provinceKey: "SUD_KIVU", lat: -2.51, lng: 28.86, bounds: [[-5.5, 27.3], [-1.0, 30.8]], zoom: 8 },
        { key: "province-lualaba", name: "Lualaba", kind: "Province", provinceKey: "LUALABA", lat: -10.72, lng: 25.47, bounds: [[-11.8, 21.8], [-7.0, 25.8]], zoom: 8 },
        { key: "province-kasai-central", name: "Kasaï-Central", kind: "Province", provinceKey: "KASAI_CENTRAL", lat: -5.9, lng: 22.42, bounds: [[-7.5, 21.4], [-4.6, 24.5]], zoom: 8 },
        { key: "province-kasai-oriental", name: "Kasaï-Oriental", kind: "Province", provinceKey: "KASAI_ORIENTAL", lat: -6.15, lng: 23.6, bounds: [[-7.1, 22.1], [-5.0, 25.5]], zoom: 8 },
        { key: "province-equateur", name: "Équateur", kind: "Province", provinceKey: "EQUATEUR", lat: 0.05, lng: 18.27, bounds: [[-2.5, 16.0], [1.5, 21.2]], zoom: 8 },
        { key: "province-tshopo", name: "Tshopo", kind: "Province", provinceKey: "TSHOPO", lat: 0.52, lng: 25.19, bounds: [[-1.5, 22.0], [3.2, 28.9]], zoom: 8 },
        { key: "ville-kinshasa", name: "Ville de Kinshasa", kind: "Ville", provinceKey: "KINSHASA", lat: -4.325, lng: 15.322, radiusKm: 24, zoom: 11 },
        { key: "commune-bandalungwa", name: "Bandalungwa", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3289, lng: 15.2706, radiusKm: 3.5, zoom: 14 },
        { key: "commune-gombe", name: "Gombe", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3112, lng: 15.3128, radiusKm: 3.5, zoom: 14 },
        { key: "commune-limete", name: "Limete", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3694, lng: 15.3576, radiusKm: 4, zoom: 14 },
        { key: "commune-lingwala", name: "Lingwala", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3255, lng: 15.3006, radiusKm: 3.5, zoom: 14 },
        { key: "commune-kintambo", name: "Kintambo", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3431, lng: 15.2861, radiusKm: 4, zoom: 14 },
        { key: "commune-kalamu", name: "Kalamu", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3479, lng: 15.3018, radiusKm: 4, zoom: 14 },
        { key: "commune-ngaliema", name: "Ngaliema", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3652, lng: 15.2498, radiusKm: 5.5, zoom: 13 },
        { key: "commune-masina", name: "Masina", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3857, lng: 15.4135, radiusKm: 5, zoom: 13 },
        { key: "commune-matete", name: "Matete", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3836, lng: 15.3382, radiusKm: 4, zoom: 14 },
        { key: "commune-lemba", name: "Lemba", kind: "Commune", provinceKey: "KINSHASA", lat: -4.4009, lng: 15.3087, radiusKm: 4, zoom: 14 },
        { key: "commune-barumbu", name: "Barumbu", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3169, lng: 15.3285, radiusKm: 3.5, zoom: 14 },
        { key: "commune-bumbu", name: "Bumbu", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3863, lng: 15.2858, radiusKm: 4, zoom: 14 },
        { key: "commune-selembao", name: "Selembao", kind: "Commune", provinceKey: "KINSHASA", lat: -4.4052, lng: 15.2746, radiusKm: 4.5, zoom: 14 },
        { key: "commune-kimbanseke", name: "Kimbanseke", kind: "Commune", provinceKey: "KINSHASA", lat: -4.4285, lng: 15.3977, radiusKm: 5.5, zoom: 13 },
        { key: "quartier-binza", name: "Binza", kind: "Quartier", provinceKey: "KINSHASA", lat: -4.3522, lng: 15.2519, radiusKm: 2, zoom: 15 },
        { key: "quartier-matonge", name: "Matonge", kind: "Quartier", provinceKey: "KINSHASA", lat: -4.3278, lng: 15.2981, radiusKm: 2, zoom: 15 },
        { key: "quartier-kauka", name: "Kauka", kind: "Quartier", provinceKey: "KINSHASA", lat: -4.3524, lng: 15.3157, radiusKm: 2, zoom: 15 },
        { key: "quartier-yolo", name: "Yolo", kind: "Quartier", provinceKey: "KINSHASA", lat: -4.3601, lng: 15.3224, radiusKm: 2, zoom: 15 },
        { key: "quartier-kingabwa", name: "Kingabwa", kind: "Quartier", provinceKey: "KINSHASA", lat: -4.3619, lng: 15.3478, radiusKm: 2.5, zoom: 15 },
        { key: "commune-kasa-vubu", name: "Kasa-Vubu", kind: "Commune", provinceKey: "KINSHASA", lat: -4.3374, lng: 15.3046, radiusKm: 3.5, zoom: 14 },
        { key: "ville-lubumbashi", name: "Lubumbashi", kind: "Ville", provinceKey: "HAUT_KATANGA", lat: -11.6647, lng: 27.4794, radiusKm: 22, zoom: 11 },
        { key: "commune-kenya", name: "Commune de la Kenya", kind: "Commune", provinceKey: "HAUT_KATANGA", lat: -11.6908, lng: 27.4705, radiusKm: 3, zoom: 15 },
        { key: "commune-kampemba", name: "Commune de Kampemba", kind: "Commune", provinceKey: "HAUT_KATANGA", lat: -11.6376, lng: 27.4958, radiusKm: 4, zoom: 14 },
        { key: "commune-katuba", name: "Commune de Katuba", kind: "Commune", provinceKey: "HAUT_KATANGA", lat: -11.6762, lng: 27.4489, radiusKm: 4, zoom: 14 },
        { key: "commune-ruashi", name: "Commune de Ruashi", kind: "Commune", provinceKey: "HAUT_KATANGA", lat: -11.6189, lng: 27.5212, radiusKm: 4.5, zoom: 14 },
        { key: "commune-annexe-lubumbashi", name: "Commune Annexe", kind: "Commune", provinceKey: "HAUT_KATANGA", lat: -11.6498, lng: 27.4558, radiusKm: 4.5, zoom: 14 },
        { key: "ville-likasi", name: "Likasi", kind: "Ville", provinceKey: "HAUT_KATANGA", lat: -10.9814, lng: 26.7338, radiusKm: 12, zoom: 12 },
        { key: "ville-kolwezi", name: "Kolwezi", kind: "Ville", provinceKey: "LUALABA", lat: -10.7148, lng: 25.4724, radiusKm: 14, zoom: 12 },
        { key: "commune-manika", name: "Commune de Manika", kind: "Commune", provinceKey: "LUALABA", lat: -10.7056, lng: 25.4938, radiusKm: 4, zoom: 14 },
        { key: "commune-dilala", name: "Commune de Dilala", kind: "Commune", provinceKey: "LUALABA", lat: -10.7311, lng: 25.4508, radiusKm: 4.5, zoom: 14 },
        { key: "ville-goma", name: "Goma", kind: "Ville", provinceKey: "NORD_KIVU", lat: -1.6792, lng: 29.2228, radiusKm: 15, zoom: 12 },
        { key: "commune-goma-ville", name: "Commune de Goma", kind: "Commune", provinceKey: "NORD_KIVU", lat: -1.6835, lng: 29.2334, radiusKm: 4, zoom: 14 },
        { key: "commune-karisimbi", name: "Commune de Karisimbi", kind: "Commune", provinceKey: "NORD_KIVU", lat: -1.6467, lng: 29.2088, radiusKm: 4, zoom: 14 },
        { key: "ville-bukavu", name: "Bukavu", kind: "Ville", provinceKey: "SUD_KIVU", lat: -2.5083, lng: 28.8608, radiusKm: 13, zoom: 12 },
        { key: "commune-ibanda", name: "Commune d'Ibanda", kind: "Commune", provinceKey: "SUD_KIVU", lat: -2.5019, lng: 28.8746, radiusKm: 4, zoom: 14 },
        { key: "commune-kadutu", name: "Commune de Kadutu", kind: "Commune", provinceKey: "SUD_KIVU", lat: -2.5195, lng: 28.8513, radiusKm: 4, zoom: 14 },
        { key: "commune-bagira", name: "Commune de Bagira", kind: "Commune", provinceKey: "SUD_KIVU", lat: -2.4874, lng: 28.8352, radiusKm: 4, zoom: 14 },
        { key: "ville-uvira", name: "Uvira", kind: "Ville", provinceKey: "SUD_KIVU", lat: -3.3953, lng: 29.1416, radiusKm: 10, zoom: 12 },
        { key: "ville-mbuji-mayi", name: "Mbuji-Mayi", kind: "Ville", provinceKey: "KASAI_ORIENTAL", lat: -6.15, lng: 23.6, radiusKm: 14, zoom: 12 },
        { key: "commune-dibindi", name: "Commune de Dibindi", kind: "Commune", provinceKey: "KASAI_ORIENTAL", lat: -6.1373, lng: 23.5963, radiusKm: 4, zoom: 14 },
        { key: "commune-diulu", name: "Commune de Diulu", kind: "Commune", provinceKey: "KASAI_ORIENTAL", lat: -6.1211, lng: 23.6112, radiusKm: 4, zoom: 14 },
        { key: "commune-bipemba", name: "Commune de Bipemba", kind: "Commune", provinceKey: "KASAI_ORIENTAL", lat: -6.1289, lng: 23.5751, radiusKm: 4, zoom: 14 },
        { key: "commune-muya", name: "Commune de Muya", kind: "Commune", provinceKey: "KASAI_ORIENTAL", lat: -6.1762, lng: 23.5984, radiusKm: 4, zoom: 14 },
        { key: "commune-kanzala", name: "Commune de Kanzala", kind: "Commune", provinceKey: "KASAI_ORIENTAL", lat: -6.1428, lng: 23.6291, radiusKm: 4, zoom: 14 },
        { key: "ville-kananga", name: "Kananga", kind: "Ville", provinceKey: "KASAI_CENTRAL", lat: -5.8962, lng: 22.4178, radiusKm: 12, zoom: 12 },
        { key: "commune-kananga-centre", name: "Commune de Kananga", kind: "Commune", provinceKey: "KASAI_CENTRAL", lat: -5.8922, lng: 22.4199, radiusKm: 4, zoom: 14 },
        { key: "commune-katoka", name: "Commune de Katoka", kind: "Commune", provinceKey: "KASAI_CENTRAL", lat: -5.9054, lng: 22.4017, radiusKm: 4, zoom: 14 },
        { key: "commune-ndesha", name: "Commune de Ndesha", kind: "Commune", provinceKey: "KASAI_CENTRAL", lat: -5.8834, lng: 22.4362, radiusKm: 4, zoom: 14 },
        { key: "commune-lukonga", name: "Commune de Lukonga", kind: "Commune", provinceKey: "KASAI_CENTRAL", lat: -5.9148, lng: 22.4246, radiusKm: 4, zoom: 14 },
        { key: "ville-kisangani", name: "Kisangani", kind: "Ville", provinceKey: "TSHOPO", lat: 0.5153, lng: 25.1911, radiusKm: 16, zoom: 12 },
        { key: "commune-makiso", name: "Commune Makiso", kind: "Commune", provinceKey: "TSHOPO", lat: 0.5174, lng: 25.1972, radiusKm: 4, zoom: 14 },
        { key: "commune-tshopo", name: "Commune Tshopo", kind: "Commune", provinceKey: "TSHOPO", lat: 0.5312, lng: 25.2368, radiusKm: 4, zoom: 14 },
        { key: "commune-lubunga", name: "Commune Lubunga", kind: "Commune", provinceKey: "TSHOPO", lat: 0.4831, lng: 25.1415, radiusKm: 4, zoom: 14 },
        { key: "commune-mangobo", name: "Commune Mangobo", kind: "Commune", provinceKey: "TSHOPO", lat: 0.5348, lng: 25.2147, radiusKm: 4, zoom: 14 },
        { key: "ville-bunia", name: "Bunia", kind: "Ville", provinceKey: "ITURI", lat: 1.5593, lng: 30.2522, radiusKm: 10, zoom: 12 },
        { key: "ville-mbandaka", name: "Mbandaka", kind: "Ville", provinceKey: "EQUATEUR", lat: 0.0477, lng: 18.2678, radiusKm: 10, zoom: 12 },
        { key: "ville-kikwit", name: "Kikwit", kind: "Ville", provinceKey: "KWILU", lat: -5.0409, lng: 18.8162, radiusKm: 10, zoom: 12 },
        { key: "ville-matadi", name: "Matadi", kind: "Ville", provinceKey: "KONGO_CENTRAL", lat: -5.8167, lng: 13.4833, radiusKm: 10, zoom: 12 },
        { key: "ville-boma", name: "Boma", kind: "Ville", provinceKey: "KONGO_CENTRAL", lat: -5.8527, lng: 13.0536, radiusKm: 10, zoom: 12 },
        { key: "ville-gbadolite", name: "Gbadolite", kind: "Ville", provinceKey: "NORD_UBANGI", lat: 4.279, lng: 21.016, radiusKm: 10, zoom: 12 },
        { key: "ville-gemena", name: "Gemena", kind: "Ville", provinceKey: "SUD_UBANGI", lat: 3.2565, lng: 19.7723, radiusKm: 10, zoom: 12 },
        { key: "ville-isiro", name: "Isiro", kind: "Ville", provinceKey: "HAUT_UELE", lat: 2.7739, lng: 27.616, radiusKm: 10, zoom: 12 }
    ];
    const PROVINCE_INDEX = Object.fromEntries(PROVINCE_AREAS.map((province) => [province.key, province]));
    const SEARCH_AREA_INDEX = Object.fromEntries(SEARCH_AREAS.map((area) => [area.key, area]));

    map.on("click", (e) => {
        if (!e || !e.latlng) return;
        selectNeighborhoodZone(
            {
                lat: Number(e.latlng.lat.toFixed(6)),
                lng: Number(e.latlng.lng.toFixed(6)),
            },
            { source: "map", flyTo: false }
        );
    });

    const el = {
        modal: document.getElementById("report-modal"),
        openModalBtn: document.getElementById("add-report-btn"),
        closeModalBtn: document.getElementById("close-report-modal"),
        gpsStatus: document.getElementById("gps-status"),
        reportForm: document.getElementById("report-form"),
        submitBtn: document.getElementById("submit-report-btn"),
        submitProgress: document.getElementById("submit-progress"),
        submitProgressFill: document.getElementById("submit-progress-fill"),
        toast: document.getElementById("toast-success"),
        photoOrb: document.getElementById("photo-orb"),
        mediaTypeInput: document.getElementById("media-type-input"),
        videoDurationInput: document.getElementById("video-duration-input"),
        mediaModeButtons: document.querySelectorAll(".capture-mode-btn[data-media-mode]"),
        dataSaverBtn: document.getElementById("data-saver-btn"),
        networkBadge: document.getElementById("network-badge"),
        photoInput: document.getElementById("photo-input"),
        videoInput: document.getElementById("video-input"),
        audioInput: document.getElementById("audio-input"),
        photoPreview: document.getElementById("photo-preview"),
        videoPreview: document.getElementById("video-preview"),
        reportAudioPreview: document.getElementById("report-audio-preview"),
        audioWaveCanvas: document.getElementById("audio-wave-canvas"),
        audioPreviewRow: document.getElementById("audio-preview-row"),
        cameraIcon: document.getElementById("camera-icon"),
        audioRecorderBox: document.getElementById("audio-recorder-box"),
        audioRecDot: document.getElementById("audio-rec-dot"),
        audioRecStatus: document.getElementById("audio-rec-status"),
        audioRecTimer: document.getElementById("audio-rec-timer"),
        audioRecordStartBtn: document.getElementById("audio-record-start-btn"),
        audioRecordStopBtn: document.getElementById("audio-record-stop-btn"),
        audioRecordResetBtn: document.getElementById("audio-record-reset-btn"),
        publishAnonymouslyInput: document.getElementById("publish-anonymously-input"),
        isPollInput: document.getElementById("is-poll-input"),
        descriptionInput: document.getElementById("description-input"),
        adminPollRow: document.getElementById("admin-poll-row"),
        installBtn: document.getElementById("installBtn"),
        iosHint: document.getElementById("iosHint"),
        installGate: document.getElementById("install-gate"),
        installGateInstallBtn: document.getElementById("install-gate-install-btn"),
        installGateContinueBtn: document.getElementById("install-gate-continue-btn"),
        menuFilterButtons: document.querySelectorAll(".menu-filter-btn[data-filter]"),
        categoryInput: document.getElementById("category-input"),
        categoryButtons: document.querySelectorAll(".category-btn"),
        openProfileBtn: document.getElementById("open-profile-btn"),
        openProfileBtnBottom: document.getElementById("open-profile-btn-bottom"),
        userNavLabel: document.getElementById("user-nav-label"),
        profileAlertDot: document.getElementById("profile-alert-dot"),
        closeProfileBtn: document.getElementById("close-profile-drawer"),
        profileDrawer: document.getElementById("profile-drawer"),
        profileAdminControlBtn: document.getElementById("profile-admin-control-btn"),
        openMenuBtn: document.getElementById("open-menu-btn"),
        closeMenuBtn: document.getElementById("close-menu-drawer"),
        menuDrawer: document.getElementById("menu-drawer"),
        menuLinkMap: document.getElementById("menu-link-map"),
        menuLinkHistory: document.getElementById("menu-link-history"),
        menuLinkHistoryBadge: document.getElementById("menu-link-history-badge"),
        menuLinkHelp: document.getElementById("menu-link-help"),
        menuLinkAbout: document.getElementById("menu-link-about"),
        menuInfoModal: document.getElementById("menu-info-modal"),
        closeMenuInfoModal: document.getElementById("close-menu-info-modal"),
        menuInfoTitle: document.getElementById("menu-info-title"),
        menuInfoBody: document.getElementById("menu-info-body"),
        resetMapBtn: document.getElementById("reset-map-btn"),
        drawerBackdrop: document.getElementById("drawer-backdrop"),
        myReportsBtn: document.getElementById("my-reports-btn"),
        profileAllyBtn: document.getElementById("profile-ally-btn"),
        profileFollowBtn: document.getElementById("profile-follow-btn"),
        changeProfilePhotoBtn: document.getElementById("change-profile-photo-btn"),
        profilePhotoInput: document.getElementById("profile-photo-input"),
        profileAvatarImg: document.getElementById("profile-avatar-img"),
        avatarLevelBadge: document.getElementById("avatar-level-badge"),
        profileName: document.getElementById("profile-name"),
        profileRank: document.getElementById("profile-rank"),
        notifBtn: document.getElementById("notif-btn"),
        notifPanel: document.getElementById("notif-panel"),
        notifList: document.getElementById("notif-list"),
        notifDot: document.getElementById("notif-dot"),
        timeFilterSelect: document.getElementById("time-filter-select"),
        mapSearchInput: document.getElementById("map-search-input"),
        mapSearchClearBtn: document.getElementById("map-search-clear-btn"),
        mapSearchLocateBtn: document.getElementById("map-search-locate-btn"),
        provinceFilterSelect: document.getElementById("province-filter-select"),
        mapSearchSuggestions: document.getElementById("map-search-suggestions"),
        mapLegendToggleBtn: document.getElementById("map-legend-toggle-btn"),
        mapLegendPanel: document.getElementById("map-legend-panel"),
        mapLegendCloseBtn: document.getElementById("map-legend-close-btn"),
        adminBroadcastBanner: document.getElementById("admin-broadcast-banner"),
        adminBroadcastMessage: document.getElementById("admin-broadcast-message"),
        adminBroadcastCloseBtn: document.getElementById("admin-broadcast-close-btn"),
        adminBroadcastMapBtn: document.getElementById("admin-broadcast-map-btn"),
        adminBroadcastThreadBtn: document.getElementById("admin-broadcast-thread-btn"),
        broadcastThreadPanel: document.getElementById("broadcast-thread-panel"),
        closeBroadcastThreadBtn: document.getElementById("close-broadcast-thread-btn"),
        broadcastThreadTitle: document.getElementById("broadcast-thread-title"),
        broadcastThreadMeta: document.getElementById("broadcast-thread-meta"),
        broadcastThreadComments: document.getElementById("broadcast-thread-comments"),
        broadcastThreadForm: document.getElementById("broadcast-thread-form"),
        broadcastThreadInput: document.getElementById("broadcast-thread-input"),
        broadcastConfirmBtn: document.getElementById("broadcast-confirm-btn"),
        broadcastDisagreeBtn: document.getElementById("broadcast-disagree-btn"),
        navMapBtn: document.getElementById("nav-map-btn"),
        navKnowledgeBtn: document.getElementById("nav-knowledge-btn"),
        navFeedBtn: document.getElementById("nav-feed-btn"),
        feedPanel: document.getElementById("feed-panel"),
        openStatsFromFeedBtn: document.getElementById("open-stats-from-feed-btn"),
        closeFeedBtn: document.getElementById("close-feed-btn"),
        feedList: document.getElementById("feed-list"),
        feedDetailModal: document.getElementById("feed-detail-modal"),
        closeFeedDetailBtn: document.getElementById("close-feed-detail-btn"),
        feedDetailBody: document.getElementById("feed-detail-body"),
        debateModal: document.getElementById("debate-modal"),
        closeDebateBtn: document.getElementById("close-debate-btn"),
        debateTitle: document.getElementById("debate-title"),
        debateAuthHint: document.getElementById("debate-auth-hint"),
        debateForm: document.getElementById("debate-form"),
        debateSideButtons: document.querySelectorAll(".debate-side-btn"),
        debateSideInput: document.getElementById("debate-side-input"),
        debatePseudonym: document.getElementById("debate-pseudonym"),
        debateText: document.getElementById("debate-text"),
        debateRecordBtn: document.getElementById("debate-record-btn"),
        debateTranscribeBtn: document.getElementById("debate-transcribe-btn"),
        debateAudioPreview: document.getElementById("debate-audio-preview"),
        debateSubmitBtn: document.getElementById("debate-submit-btn"),
        debateLegalList: document.getElementById("debate-legal-list"),
        debateChangeList: document.getElementById("debate-change-list"),
        debateLegalCount: document.getElementById("debate-legal-count"),
        debateChangeCount: document.getElementById("debate-change-count"),
        debateBalanceLegal: document.getElementById("debate-balance-legal"),
        debateBalanceChange: document.getElementById("debate-balance-change"),
        socialProfileModal: document.getElementById("social-profile-modal"),
        closeSocialProfileBtn: document.getElementById("close-social-profile-btn"),
        socialProfileBody: document.getElementById("social-profile-body"),
        messageNotice: document.getElementById("message-notice"),
        messageNoticeTitle: document.getElementById("message-notice-title"),
        messageNoticeText: document.getElementById("message-notice-text"),
        neighborhoodChatBtn: document.getElementById("neighborhood-chat-btn"),
        neighborhoodChatPanel: document.getElementById("neighborhood-chat-panel"),
        closeNeighborhoodChatBtn: document.getElementById("close-neighborhood-chat-btn"),
        neighborhoodChatTitle: document.getElementById("neighborhood-chat-title"),
        neighborhoodChatSubtitle: document.getElementById("neighborhood-chat-subtitle"),
        neighborhoodChatList: document.getElementById("neighborhood-chat-list"),
        neighborhoodChatForm: document.getElementById("neighborhood-chat-form"),
        neighborhoodChatInput: document.getElementById("neighborhood-chat-input"),
        neighborhoodChatSendBtn: document.getElementById("neighborhood-chat-send-btn"),
        directChatPanel: document.getElementById("direct-chat-panel"),
        closeDirectChatBtn: document.getElementById("close-direct-chat-btn"),
        directChatTitle: document.getElementById("direct-chat-title"),
        directChatSubtitle: document.getElementById("direct-chat-subtitle"),
        directChatList: document.getElementById("direct-chat-list"),
        directChatForm: document.getElementById("direct-chat-form"),
        directChatInput: document.getElementById("direct-chat-input"),
        navStatsBtn: document.getElementById("nav-stats-btn"),
        statsPanel: document.getElementById("stats-panel"),
        closeStatsBtn: document.getElementById("close-stats-btn"),
        statsResolvedFill: document.getElementById("stats-resolved-fill"),
        statsReportedFill: document.getElementById("stats-reported-fill"),
        topCitizensList: document.getElementById("top-citizens-list"),
        knowledgePanel: document.getElementById("knowledge-panel"),
        closeKnowledgeBtn: document.getElementById("close-knowledge-btn"),
        knowledgeInstitutionFilter: document.getElementById("knowledge-institution-filter"),
        knowledgeCategoryFilter: document.getElementById("knowledge-category-filter"),
        knowledgeSearchInput: document.getElementById("knowledge-search-input"),
        knowledgeSearchSuggestions: document.getElementById("knowledge-search-suggestions"),
        knowledgeForm: document.getElementById("knowledge-form"),
        knowledgeCategoryCards: document.querySelectorAll(".knowledge-category-card"),
        knowledgeTitleInput: document.getElementById("knowledge-title-input"),
        knowledgeContentInput: document.getElementById("knowledge-content-input"),
        knowledgeLinkInput: document.getElementById("knowledge-link-input"),
        knowledgeInstitutionInput: document.getElementById("knowledge-institution-input"),
        knowledgeCategoryInput: document.getElementById("knowledge-category-input"),
        knowledgeTagsInput: document.getElementById("knowledge-tags-input"),
        knowledgeFileInput: document.getElementById("knowledge-file-input"),
        publishKnowledgeBtn: document.getElementById("publish-knowledge-btn"),
        knowledgeList: document.getElementById("knowledge-list"),
        knowledgeQrModal: document.getElementById("knowledge-qr-modal"),
        closeKnowledgeQrBtn: document.getElementById("close-knowledge-qr-btn"),
        knowledgeQrStage: document.getElementById("knowledge-qr-stage"),
        knowledgeQrSubtitle: document.getElementById("knowledge-qr-subtitle"),
        knowledgeFlyerBtn: document.getElementById("knowledge-flyer-btn"),
        surveyYesBtn: document.getElementById("survey-yes-btn"),
        surveyNoBtn: document.getElementById("survey-no-btn"),
        surveyBanner: document.getElementById("survey-banner"),
        confettiLayer: document.getElementById("confetti-layer"),
        reportSuccessFlash: document.getElementById("report-success-flash"),
        heatmapToggleBtn: document.getElementById("heatmap-toggle-btn"),
        totalReports: document.getElementById("profile-total-reports"),
        sessionReports: document.getElementById("profile-session-reports"),
        knowledgeCount: document.getElementById("profile-knowledge-count"),
        knowledgeBadge: document.getElementById("profile-knowledge-badge"),
        profileLevelBadge: document.getElementById("profile-level-badge"),
        profileLevelTitle: document.getElementById("profile-level-title"),
        profileLevelFill: document.getElementById("profile-level-fill"),
        profileLevelMeta: document.getElementById("profile-level-meta"),
        levelModeFastBtn: document.getElementById("level-mode-fast-btn"),
        levelModeCompetitiveBtn: document.getElementById("level-mode-competitive-btn"),
        levelupModal: document.getElementById("levelup-modal"),
        levelupText: document.getElementById("levelup-text")
    };

    const S = {
        currentCoords: null,
        totalReports: 0,
        sessionReports: 0,
        activeFilter: "ALL",
        timeFilter: "ALL",
        mapSearchQuery: "",
        mapSearchAnchor: null,
        provinceFilter: "",
        mapSearchSuggestions: [],
        heatmapMode: false,
        unreadNotifications: 0,
        notifications: [],
        knowledgeItems: [],
        knowledgeLibraryAll: [],
        knowledgeContributionCount: 0,
        knowledgeSearchQuery: "",
        activeKnowledgeQr: null,
        feedItems: [],
        userGeo: null,
        dataSaverEnabled: true,
        dataSaverForced: false,
        networkForcedNotified: false,
        follows: {},
        allies: {},
        allyResourceSeenAt: 0,
        activeSocialHash: "",
        activeDirectChatHash: "",
        activeDirectChatName: "",
        activeNeighborhoodRoom: null,
        selectedNeighborhoodZone: null,
        neighborhoodCircleLayer: null,
        joinedNeighborhoodRoomKey: "",
        latestMessageSeenAt: "",
        lastNotifiedNotificationAt: "",
        realtimeSocket: null,
        realtimeReconnectTimer: 0,
        viewedProfileHash: "",
        lastAdminBroadcastId: 0,
        lastAdminPayload: null,
        adminBroadcastMarker: null,
        adminBroadcastCircle: null,
        activeBroadcastThreadId: 0,
        lastPollSignalementId: 0,
        profileRank: "Citoyen Novice",
        points: 0,
        level: 1,
        progressionMode: "fast",
        rankingScores: {},
        topCitizens: [],
        top10Hashes: {},
        markerStore: [],
        submitProgressTimer: null,
        submitProgressValue: 0,
        tensionLayer: L.layerGroup(),
        debateSignalementId: 0,
        debateAudioBlob: null,
        debateRecorder: null,
        debateRecordChunks: [],
        debateMicStream: null,
        debateIsRecording: false,
        reportAudioBlob: null,
        reportAudioRecorder: null,
        reportAudioChunks: [],
        reportAudioStream: null,
        reportAudioSeconds: 0,
        reportAudioTimer: null,
        reportAudioRecording: false,
        reportAudioContext: null,
        reportAudioAnalyser: null,
        reportAudioSource: null,
        reportAudioWaveData: null,
        reportAudioWaveRaf: null,
        activeMarkerAudioId: 0,
        pendingMapFocusFilter: "",
        pendingSharedFocusId: 0,
        feedReactionRecorder: null,
        feedReactionStream: null,
        feedReactionTimer: null,
        feedReactionSeconds: 0,
        feedReactionBlob: null,
        feedReactionTargetId: 0,
        voteFeedbackIds: {},
        latestHistoryAudioTs: 0,
        activeFeedDetailId: 0,
        pollFeedbackIds: {}
    };

    function esc(v) {
        return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function getCookie(name) {
        const item = document.cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith(name + "="));
        return item ? decodeURIComponent(item.split("=")[1]) : null;
    }

    function isSuperuser() {
        return Boolean(document.body && document.body.dataset && document.body.dataset.superuser === "1");
    }

    function isStaffUser() {
        return Boolean(document.body && document.body.dataset && document.body.dataset.staff === "1");
    }

    function normalizeSearchText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function pointInBounds(lat, lng, bounds) {
        if (!Array.isArray(bounds) || bounds.length !== 2) return false;
        const south = Number(bounds[0] && bounds[0][0]);
        const west = Number(bounds[0] && bounds[0][1]);
        const north = Number(bounds[1] && bounds[1][0]);
        const east = Number(bounds[1] && bounds[1][1]);
        if (![south, west, north, east].every(Number.isFinite)) return false;
        return lat >= south && lat <= north && lng >= west && lng <= east;
    }

    function areaProvinceName(area) {
        const province = area && area.provinceKey ? PROVINCE_INDEX[area.provinceKey] : null;
        return province ? province.name : "";
    }

    function getMapSearchHaystack(item) {
        return normalizeSearchText([
            item && item.title,
            item && item.description,
            item && item.category,
            item && item.category_label,
            item && item.author_label
        ].join(" "));
    }

    function getSearchSuggestions(query) {
        const q = normalizeSearchText(query);
        if (q.length < 3) return [];
        return SEARCH_AREAS
            .filter((area) => normalizeSearchText([
                area.name,
                area.kind,
                areaProvinceName(area)
            ].join(" ")).includes(q))
            .slice(0, 6);
    }

    function matchesMapSearch(item) {
        if (!S.mapSearchAnchor && !S.provinceFilter) return true;
        return true;
    }

    function matchesMapAnchor(item) {
        if (!S.mapSearchAnchor) return true;
        const lat = Number(item && item.lat);
        const lng = Number(item && item.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        if (S.mapSearchAnchor.bounds) return pointInBounds(lat, lng, S.mapSearchAnchor.bounds);
        const radiusMeters = Number((S.mapSearchAnchor.radiusKm || 2) * 1000);
        return haversineMeters(S.mapSearchAnchor.lat, S.mapSearchAnchor.lng, lat, lng) <= radiusMeters;
    }

    function matchesProvinceFilter(item) {
        if (!S.provinceFilter) return true;
        const province = PROVINCE_INDEX[S.provinceFilter];
        const lat = Number(item && item.lat);
        const lng = Number(item && item.lng);
        if (!province || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        return pointInBounds(lat, lng, province.bounds);
    }

    function focusArea(area) {
        if (!area) return;
        if (area.bounds) {
            map.fitBounds(area.bounds, {
                padding: [32, 32],
                maxZoom: Number(area.zoom || 10)
            });
            return;
        }
        map.flyTo([area.lat, area.lng], Number(area.zoom || 15), { duration: 0.9, easeLinearity: 0.25 });
    }

    function syncProvinceFilterUi() {
        if (el.provinceFilterSelect) {
            el.provinceFilterSelect.value = S.provinceFilter || "";
        }
    }

    function setProvinceFilter(provinceKey, opts) {
        const options = Object.assign({ focus: false, preserveAnchor: false }, opts);
        S.provinceFilter = provinceKey && PROVINCE_INDEX[provinceKey] ? provinceKey : "";
        if (!options.preserveAnchor) S.mapSearchAnchor = null;
        syncProvinceFilterUi();
        syncMapSearchUi();
        refreshNeighborhoodChatButton();
        applyFilter();
        if (options.focus && S.provinceFilter) focusArea(PROVINCE_INDEX[S.provinceFilter]);
    }

    function renderMapSearchSuggestions() {
        if (!el.mapSearchSuggestions) return;
        if (!S.mapSearchSuggestions.length) {
            el.mapSearchSuggestions.innerHTML = "";
            el.mapSearchSuggestions.classList.remove("show");
            return;
        }
        el.mapSearchSuggestions.innerHTML = S.mapSearchSuggestions.map((area) =>
            '<li><button class="map-search-suggestion" type="button" data-search-area-key="' + esc(area.key) + '">' +
            '<span>' + esc(area.name) + '</span><span class="map-search-meta">' + esc(area.kind + (areaProvinceName(area) ? " • " + areaProvinceName(area) : "")) + '</span>' +
            "</button></li>"
        ).join("");
        el.mapSearchSuggestions.classList.add("show");
    }

    function setMapSearchAnchor(area) {
        if (!area) return;
        if (area.kind === "Province" && area.provinceKey) {
            S.mapSearchQuery = normalizeSearchText(area.name);
            if (el.mapSearchInput) el.mapSearchInput.value = area.name;
            S.mapSearchSuggestions = [];
            renderMapSearchSuggestions();
            syncMapSearchUi();
            setProvinceFilter(area.provinceKey, { focus: true });
            const provinceMatches = S.markerStore.filter((entry) => matchesProvinceFilter(entry.data));
            if (!provinceMatches.length) showToast("Aucun incident signalé dans " + area.name + " pour l'instant");
            return;
        }
        S.provinceFilter = "";
        syncProvinceFilterUi();
        S.mapSearchAnchor = {
            key: area.key,
            name: area.name,
            lat: area.lat,
            lng: area.lng,
            radiusKm: area.radiusKm,
            bounds: area.bounds || null,
            zoom: area.zoom || 15
        };
        S.mapSearchQuery = normalizeSearchText(area.name);
        if (el.mapSearchInput) el.mapSearchInput.value = area.name;
        S.mapSearchSuggestions = [];
        renderMapSearchSuggestions();
        syncMapSearchUi();
        refreshNeighborhoodChatButton();
        applyFilter();
        focusArea(area);
        const nearby = S.markerStore.filter((entry) => matchesProvinceFilter(entry.data) && matchesMapAnchor(entry.data));
        if (!nearby.length) {
            showToast("Aucun incident signalé à " + area.name + " pour l'instant");
        }
    }

    function syncMapSearchUi() {
        if (el.mapSearchClearBtn) {
            el.mapSearchClearBtn.classList.toggle("show", Boolean(S.mapSearchQuery || S.provinceFilter));
        }
    }

    function setMapLegendOpen(isOpen) {
        if (!el.mapLegendPanel || !el.mapLegendToggleBtn) return;
        el.mapLegendPanel.classList.toggle("open", Boolean(isOpen));
        el.mapLegendPanel.setAttribute("aria-hidden", isOpen ? "false" : "true");
        el.mapLegendToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    function toggleMapLegend() {
        if (!el.mapLegendPanel) return;
        setMapLegendOpen(!el.mapLegendPanel.classList.contains("open"));
    }

    function populateProvinceFilterOptions() {
        if (!el.provinceFilterSelect) return;
        const options = ['<option value="">Toutes les provinces</option>'].concat(
            PROVINCE_AREAS.map((province) => '<option value="' + esc(province.key) + '">' + esc(province.name) + '</option>')
        );
        el.provinceFilterSelect.innerHTML = options.join("");
        syncProvinceFilterUi();
    }

    populateProvinceFilterOptions();
    refreshNeighborhoodChatButton();

    if (el.adminPollRow) {
        el.adminPollRow.classList.toggle("visible", isSuperuser());
    }
    if (el.profileAdminControlBtn) {
        el.profileAdminControlBtn.classList.toggle("show", isStaffUser());
    }

    function showToast(msg, tone) {
        el.toast.textContent = msg;
        el.toast.classList.toggle("voice-success", tone === "voice-success");
        el.toast.classList.toggle("filter-confirm", tone === "filter-confirm");
        el.toast.classList.add("show");
        window.setTimeout(() => {
            el.toast.classList.remove("show");
            el.toast.classList.remove("voice-success");
            el.toast.classList.remove("filter-confirm");
        }, 2400);
    }

    function showMessageNotice(title, text) {
        if (!el.messageNotice || !el.messageNoticeTitle || !el.messageNoticeText) return;
        el.messageNoticeTitle.textContent = title || "Nouveau message";
        el.messageNoticeText.textContent = text || "";
        el.messageNotice.classList.add("show");
        window.clearTimeout(showMessageNotice._timer);
        showMessageNotice._timer = window.setTimeout(() => {
            el.messageNotice.classList.remove("show");
        }, 3200);
    }

    function formatChatTime(value) {
        if (!value) return "";
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return "";
        return dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }

    function formatRelativeTime(value) {
        if (!value) return "";
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return "";
        const seconds = Math.max(0, Math.round((Date.now() - dt.getTime()) / 1000));
        if (seconds < 45) return "À l'instant";
        if (seconds < 90) return "Il y a 1 min";
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return "Il y a " + minutes + " min";
        const hours = Math.round(minutes / 60);
        if (hours < 24) return "Il y a " + hours + " h";
        const days = Math.round(hours / 24);
        if (days < 7) return "Il y a " + days + " j";
        return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    }

    function renderChatList(target, messages, emptyText) {
        if (!target) return;
        if (!Array.isArray(messages) || !messages.length) {
            target.innerHTML = '<li class="chat-empty">' + esc(emptyText || "Aucun message pour le moment.") + "</li>";
            return;
        }
        target.innerHTML = messages.map((msg) => (
            '<li class="chat-item' + (msg.is_mine ? " mine" : "") + '" data-chat-message-id="' + Number(msg.id || 0) + '">' +
            '<div class="chat-author">' + esc(msg.author_label || "SemaCitoyen") + "</div>" +
            '<div class="chat-body">' + esc(msg.body || "") + "</div>" +
            '<div class="chat-time">' + esc(formatChatTime(msg.created_at)) + "</div>" +
            "</li>"
        )).join("");
        target.scrollTop = target.scrollHeight;
    }

    function appendChatMessage(target, msg) {
        if (!target || !msg || !msg.id) return;
        const id = Number(msg.id || 0);
        if (id && target.querySelector('[data-chat-message-id="' + id + '"]')) {
            target.scrollTop = target.scrollHeight;
            return;
        }
        const empty = target.querySelector(".chat-empty");
        if (empty) empty.remove();
        const item = document.createElement("li");
        item.className = "chat-item" + (msg.is_mine ? " mine" : "");
        item.setAttribute("data-chat-message-id", String(id));
        item.innerHTML =
            '<div class="chat-author">' + esc(msg.author_label || "SemaCitoyen") + "</div>" +
            '<div class="chat-body">' + esc(msg.body || "") + "</div>" +
            '<div class="chat-time">' + esc(formatChatTime(msg.created_at)) + "</div>";
        target.appendChild(item);
        target.scrollTop = target.scrollHeight;
    }

    function getCurrentNeighborhoodArea() {
        const coords = currentGeoSource();
        return buildCircleRoom(coords);
    }

    function refreshNeighborhoodChatButton() {
        if (!el.neighborhoodChatBtn || !el.neighborhoodChatSubtitle || !el.neighborhoodChatTitle) return;
        const area = getCurrentNeighborhoodArea();
        S.activeNeighborhoodRoom = area ? {
            key: String(area.key || "").toLowerCase(),
            label: area.label,
            provinceKey: area.provinceKey || "",
            kind: area.kind || "Cercle",
            lat: area.lat,
            lng: area.lng
        } : null;
        el.neighborhoodChatBtn.textContent = area ? ("Chat: " + area.shortLabel) : "Chat local";
        const title = area ? ("Cercle du quartier : " + area.shortLabel) : "Cercle du quartier";
        el.neighborhoodChatTitle.textContent = title;
        el.neighborhoodChatSubtitle.textContent = area
            ? "Discussion live dans un rayon de 500 m autour du point choisi."
            : "Choisis une zone ou active le GPS.";
        syncNeighborhoodComposer();
        if (S.activeNeighborhoodRoom && S.activeNeighborhoodRoom.key !== S.joinedNeighborhoodRoomKey) {
            S.joinedNeighborhoodRoomKey = S.activeNeighborhoodRoom.key;
            showMessageNotice("Cercle local", "Tu es entré dans " + S.activeNeighborhoodRoom.label + ".");
            subscribeRealtimeRoom();
            if (el.neighborhoodChatPanel && !el.neighborhoodChatPanel.classList.contains("open")) {
                el.neighborhoodChatPanel.classList.add("open");
            }
            loadNeighborhoodChat();
        }
    }

    function defaultReportCategory() {
        if (!S.heatmapMode && S.activeFilter && S.activeFilter !== "ALL") {
            return S.activeFilter;
        }
        return "ENERGIE";
    }

    function selectReportCategory(category, options) {
        const opts = options || {};
        const target = String(category || "ENERGIE").toUpperCase();
        const btn = Array.from(el.categoryButtons || []).find((item) => item.dataset.value === target);
        if (!btn) return;
        el.categoryButtons.forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        el.categoryInput.value = target;
        if (el.descriptionInput) {
            el.descriptionInput.placeholder = target === "RELIGION"
                ? "Signalez des nuisances sonores, des abus ou des incidents liés aux lieux de culte."
                : "Ton témoignage";
        }
        if (target === "CONSTITUTION" || target === "POLITIQUE") {
            setMediaMode("audio");
            if (!opts.silent) showToast("Catégorie débat: micro prêt (max 60s).");
        } else {
            syncReportAudioComposer();
        }
    }

    function shortHash(v) {
        return String(v || "").replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "ANON";
    }

    function displayNameFromHash(hash) {
        return "Etudiant " + shortHash(hash);
    }

    function displayAuthorLabel(item) {
        if (item && item.publish_anonymously) return "SemaCitoyen";
        if (item && item.author_label) return item.author_label;
        const hash = String(item && (item.author_hash || item.reporter_hash) || "");
        return hash ? displayNameFromHash(hash) : "Etudiant anonyme";
    }

    function authorInitials(item) {
        if (item && item.publish_anonymously) return "SC";
        const hash = String(item && (item.author_hash || item.reporter_hash) || "");
        return initialsFromHash(hash);
    }

    function initialsFromHash(hash) {
        const code = shortHash(hash);
        return code.slice(0, 2);
    }

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("file-read"));
            reader.readAsDataURL(file);
        });
    }

    function dataUrlToFile(dataUrl, filename) {
        if (!dataUrl || dataUrl.indexOf(",") === -1) return null;
        const parts = dataUrl.split(",");
        const meta = parts[0] || "";
        const base64 = parts[1] || "";
        const mimeMatch = /data:([^;]+)/.exec(meta);
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return new File([bytes], filename, { type: mime });
    }

    function readQueuedReports() {
        try {
            const rows = JSON.parse(localStorage.getItem(REPORT_QUEUE_KEY) || "[]");
            return Array.isArray(rows) ? rows : [];
        } catch (_e) {
            return [];
        }
    }

    function writeQueuedReports(rows) {
        localStorage.setItem(REPORT_QUEUE_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
    }

    function readHistoryAudioSeenTs() {
        return Number(localStorage.getItem("semachat_history_audio_seen_ts") || "0");
    }

    function writeHistoryAudioSeenTs(value) {
        localStorage.setItem("semachat_history_audio_seen_ts", String(Number(value || 0)));
    }

    function readSocialState() {
        try {
            const follows = JSON.parse(localStorage.getItem("kolona_social_follows") || "{}");
            const allies = JSON.parse(localStorage.getItem("kolona_social_allies") || "{}");
            const seen = Number(localStorage.getItem("kolona_ally_seen_at") || "0");
            S.follows = follows && typeof follows === "object" ? follows : {};
            S.allies = allies && typeof allies === "object" ? allies : {};
            S.allyResourceSeenAt = Number.isFinite(seen) ? seen : 0;
        } catch (_e) {
            S.follows = {};
            S.allies = {};
            S.allyResourceSeenAt = 0;
        }
    }

    function persistSocialState() {
        localStorage.setItem("kolona_social_follows", JSON.stringify(S.follows));
        localStorage.setItem("kolona_social_allies", JSON.stringify(S.allies));
        localStorage.setItem("kolona_ally_seen_at", String(S.allyResourceSeenAt || 0));
    }

    function readReputationState() {
        // Points/level come from backend profile only.
        S.points = 0;
        S.level = 1;
        const mode = localStorage.getItem("kolona_level_mode");
        S.progressionMode = mode === "competitive" ? "competitive" : "fast";
    }

    function persistReputationState() {
        // Only local UI mode is persisted on device.
        localStorage.setItem("kolona_level_mode", S.progressionMode);
    }

    function levelName(level) {
        if (level >= 10) return "Sentinelle";
        if (level >= 7) return "Éclaireur";
        if (level >= 4) return "Mentor";
        return "Veilleur";
    }

    function levelRequirement(level) {
        // Server-authoritative progression curve.
        return 95 + (level - 1) * 14;
    }

    function getLevelFromPoints(points) {
        let lvl = 1;
        let remaining = Math.max(0, Math.floor(points));
        while (remaining >= levelRequirement(lvl)) {
            remaining -= levelRequirement(lvl);
            lvl += 1;
            if (lvl > 200) break;
        }
        return lvl;
    }

    function pointsToNextLevel(points) {
        let lvl = 1;
        let spent = 0;
        let remaining = Math.max(0, Math.floor(points));
        while (remaining >= levelRequirement(lvl)) {
            const req = levelRequirement(lvl);
            remaining -= req;
            spent += req;
            lvl += 1;
            if (lvl > 200) break;
        }
        const need = levelRequirement(lvl);
        const inLevel = Math.max(0, Math.floor(points) - spent);
        return {
            level: lvl,
            inLevel: inLevel,
            need: need,
            remain: Math.max(0, need - inLevel)
        };
    }

    function syncLevelModeButtons() {
        if (el.levelModeFastBtn) el.levelModeFastBtn.classList.toggle("active", S.progressionMode === "fast");
        if (el.levelModeCompetitiveBtn) el.levelModeCompetitiveBtn.classList.toggle("active", S.progressionMode === "competitive");
    }

    function setProgressionMode(mode) {
        const next = mode === "competitive" ? "competitive" : "fast";
        S.progressionMode = next;
        S.level = getLevelFromPoints(S.points);
        persistReputationState();
        syncLevelModeButtons();
        syncProfileStats();
    }

    function showLevelUp(level) {
        if (!el.levelupModal || !el.levelupText) return;
        el.levelupText.textContent = "Félicitations ! Vous êtes passé au rang de " + levelName(level) + " !";
        el.levelupModal.classList.add("open");
        if (el.confettiLayer) {
            for (let i = 0; i < 34; i += 1) {
                const p = document.createElement("span");
                p.className = "confetti-piece";
                p.style.left = (window.innerWidth / 2) + "px";
                p.style.top = (window.innerHeight / 2) + "px";
                p.style.background = ["#ffd166", "#ffb703", "#7cf2ff", "#5ed8ff", "#ff7ca8"][i % 5];
                p.style.setProperty("--dx", (Math.random() * 340 - 170).toFixed(1) + "px");
                p.style.setProperty("--dy", (-80 - Math.random() * 260).toFixed(1) + "px");
                p.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
                el.confettiLayer.appendChild(p);
                window.setTimeout(() => p.remove(), 1100);
            }
        }
        window.setTimeout(() => el.levelupModal.classList.remove("open"), 2200);
    }

    function avatarDataUrl(hash) {
        const code = shortHash(hash || "ANON");
        const c1 = "#264c78";
        const c2 = "#17324e";
        const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='" + c1 + "'/><stop offset='1' stop-color='" + c2 + "'/></linearGradient></defs><rect width='80' height='80' rx='40' fill='url(#g)'/><text x='40' y='48' text-anchor='middle' font-size='28' fill='#eaf6ff' font-family='Segoe UI' font-weight='700'>" + code.slice(0, 2) + "</text></svg>";
        return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    }

    function iconSvg(name) {
        const icons = {
            checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>',
            mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><path d="M12 19v3"></path></svg>',
            whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.7 14.5c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 .1-.2.2-.4.2-.7.1-.3-.1-1.1-.4-2.1-1.3-.7-.6-1.2-1.4-1.3-1.6-.1-.3 0-.5.1-.7l.3-.3.2-.4c.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.2 4.9 4.4.7.3 1.3.5 1.7.7.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4 0-.1-.2-.2-.5-.4z"></path><path d="M12 2a10 10 0 0 0-8.8 14.8L2 22l5.4-1.1A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3.2.7.7-3.1-.2-.3a8.3 8.3 0 1 1 7.2 4z"></path></svg>'
        };
        return icons[name] || "";
    }

    function audioWaveBarsHtml() {
        const bars = [];
        for (let i = 0; i < 18; i += 1) {
            bars.push('<span class="bar" style="animation-delay:' + (i * 0.06).toFixed(2) + 's"></span>');
        }
        return bars.join("");
    }

    function miniVisualizerHtml() {
        const bars = [];
        for (let i = 0; i < 5; i += 1) {
            bars.push('<span class="viz-bar" style="animation-delay:' + (i * 0.08).toFixed(2) + 's"></span>');
        }
        return bars.join("");
    }

    function customAudioPlayerHtml(src, options) {
        const opts = options || {};
        const signalementId = Number(opts.signalementId || 0);
        const extraClass = opts.extraClass ? (" " + opts.extraClass) : "";
        const metaLabel = opts.metaLabel ? esc(opts.metaLabel) : "Lecture audio";
        const signalementAttr = signalementId ? (' data-signalement-id="' + signalementId + '"') : "";
        return (
            '<div class="custom-audio-player' + extraClass + '" data-audio-src="' + esc(src) + '"' + signalementAttr + '>' +
            '<audio class="custom-audio-native' + (signalementId ? " popup-card-img" : "") + '"' + signalementAttr + ' preload="metadata" src="' + esc(src) + '"></audio>' +
            '<div class="custom-audio-top">' +
            '<button type="button" class="audio-play-toggle" aria-label="Lire ou mettre en pause"><span class="audio-play-icon">▶</span></button>' +
            '<div class="custom-audio-main">' +
            '<div class="custom-audio-wave">' + audioWaveBarsHtml() + '</div>' +
            '<div class="progress-bar"><div class="progress-bar-fill"></div></div>' +
            '<div class="custom-audio-meta"><span>' + metaLabel + '</span><span class="custom-audio-side"><span class="mini-visualizer">' + miniVisualizerHtml() + '</span><strong class="custom-audio-time">--:--</strong></span></div>' +
            "</div>" +
            "</div>" +
            "</div>"
        );
    }

    function formatRemainingTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
        return "-" + formatTimer(Math.round(seconds));
    }

    function getCustomPlayerAudio(player) {
        if (!player) return;
        const audio = player.querySelector(".custom-audio-native");
        if (!audio) return null;
        if (audio._customBound) return audio;
        audio.addEventListener("loadedmetadata", () => updateCustomAudioUI(player));
        audio.addEventListener("timeupdate", () => updateCustomAudioUI(player));
        audio.addEventListener("play", () => {
            document.querySelectorAll(".custom-audio-player").forEach((otherPlayer) => {
                if (otherPlayer !== player) {
                    const otherAudio = getCustomPlayerAudio(otherPlayer);
                    if (otherAudio && !otherAudio.paused) otherAudio.pause();
                }
            });
            const id = Number(player.getAttribute("data-signalement-id") || 0);
            if (id) {
                if (S.activeMarkerAudioId && S.activeMarkerAudioId !== id) setMarkerAudioPlayback(S.activeMarkerAudioId, false);
                setMarkerAudioPlayback(id, true);
            }
            setCustomAudioPlayback(player, true);
        });
        audio.addEventListener("pause", () => {
            const id = Number(player.getAttribute("data-signalement-id") || 0);
            if (id) setMarkerAudioPlayback(id, false);
            setCustomAudioPlayback(player, false);
        });
        audio.addEventListener("ended", () => {
            audio.currentTime = 0;
            updateCustomAudioUI(player);
        });
        audio._customBound = true;
        return audio;
    }

    function updateCustomAudioUI(player) {
        if (!player) return;
        const audio = getCustomPlayerAudio(player);
        if (!audio) return;
        const icon = player.querySelector(".audio-play-icon");
        const time = player.querySelector(".custom-audio-time");
        const fill = player.querySelector(".progress-bar-fill");
        const remaining = Number(audio.duration || 0) - Number(audio.currentTime || 0);
        const progress = Number.isFinite(audio.duration) && audio.duration > 0
            ? Math.max(0, Math.min(100, (Number(audio.currentTime || 0) / Number(audio.duration || 1)) * 100))
            : 0;
        if (icon) icon.textContent = audio.paused ? "▶" : "❚❚";
        if (time) time.textContent = Number.isFinite(audio.duration) && audio.duration > 0 ? formatRemainingTime(remaining) : "--:--";
        if (fill) fill.style.width = progress.toFixed(2) + "%";
    }

    function stopCustomAudioTick(player) {
        if (!player || !player._customAudioRaf) return;
        window.cancelAnimationFrame(player._customAudioRaf);
        player._customAudioRaf = 0;
    }

    function startCustomAudioTick(player) {
        const audio = getCustomPlayerAudio(player);
        if (!audio) return;
        stopCustomAudioTick(player);
        const tick = () => {
            updateCustomAudioUI(player);
            if (!audio.paused && !audio.ended) {
                player._customAudioRaf = window.requestAnimationFrame(tick);
            }
        };
        tick();
    }

    function setCustomAudioPlayback(player, isPlaying) {
        if (!player) return;
        const audio = getCustomPlayerAudio(player);
        player.classList.toggle("is-active", Boolean(isPlaying));
        player.classList.toggle("playing-now", Boolean(isPlaying));
        player.classList.toggle("is-fading", !isPlaying);
        if (!isPlaying) {
            window.setTimeout(() => {
                if (!audio || audio.paused || audio.ended) player.classList.remove("is-fading");
            }, 260);
        }
        updateCustomAudioUI(player);
        if (isPlaying) startCustomAudioTick(player);
        else stopCustomAudioTick(player);
    }

    function formatTimer(seconds) {
        const s = Math.max(0, Number(seconds || 0));
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return mm + ":" + ss;
    }

    function stopReportAudioTimer() {
        if (S.reportAudioTimer) {
            window.clearInterval(S.reportAudioTimer);
            S.reportAudioTimer = null;
        }
    }

    function resetReportAudioUI() {
        stopReportAudioTimer();
        S.reportAudioSeconds = 0;
        if (el.audioRecTimer) el.audioRecTimer.textContent = "00:00";
        if (el.audioRecDot) el.audioRecDot.classList.remove("recording");
        if (el.audioRecStatus) el.audioRecStatus.textContent = "Prêt à enregistrer";
    }

    function stopReportAudioWaveform() {
        if (S.reportAudioWaveRaf) {
            window.cancelAnimationFrame(S.reportAudioWaveRaf);
            S.reportAudioWaveRaf = null;
        }
        if (S.reportAudioSource) {
            try { S.reportAudioSource.disconnect(); } catch (_e) {}
            S.reportAudioSource = null;
        }
        if (S.reportAudioAnalyser) {
            try { S.reportAudioAnalyser.disconnect(); } catch (_e) {}
            S.reportAudioAnalyser = null;
        }
        if (S.reportAudioContext) {
            try { S.reportAudioContext.close(); } catch (_e) {}
            S.reportAudioContext = null;
        }
        S.reportAudioWaveData = null;
        if (el.audioWaveCanvas) {
            const ctx = el.audioWaveCanvas.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, el.audioWaveCanvas.width, el.audioWaveCanvas.height);
            el.audioWaveCanvas.classList.remove("live");
        }
    }

    function drawReportAudioWaveform() {
        if (!el.audioWaveCanvas || !S.reportAudioAnalyser || !S.reportAudioWaveData) return;
        const canvas = el.audioWaveCanvas;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        S.reportAudioAnalyser.getByteTimeDomainData(S.reportAudioWaveData);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(20, 8, 10, 0.32)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffb36c";
        ctx.beginPath();
        const sliceWidth = canvas.width / S.reportAudioWaveData.length;
        let x = 0;
        for (let i = 0; i < S.reportAudioWaveData.length; i += 1) {
            const v = S.reportAudioWaveData[i] / 128.0;
            const y = (v * canvas.height) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        S.reportAudioWaveRaf = window.requestAnimationFrame(drawReportAudioWaveform);
    }

    function syncReportAudioComposer() {
        const category = String(el.categoryInput && el.categoryInput.value || "").toUpperCase();
        const isConstitution = category === "CONSTITUTION";
        if (el.audioRecorderBox) {
            el.audioRecorderBox.classList.toggle("constitution-ready", isConstitution);
        }
        if (el.audioRecordStartBtn) {
            el.audioRecordStartBtn.textContent = isConstitution
                ? "🎙️ Enregistrer mon témoignage vocal"
                : "🎙️ Démarrer";
        }
        if (el.audioRecordResetBtn) {
            el.audioRecordResetBtn.classList.toggle("show", Boolean(S.reportAudioBlob && S.reportAudioBlob.size > 0));
        }
        if (el.audioPreviewRow) {
            el.audioPreviewRow.classList.toggle("has-audio", Boolean(S.reportAudioBlob && S.reportAudioBlob.size > 0));
        }
        if (!S.reportAudioRecording && el.audioRecStatus) {
            if (S.reportAudioBlob && S.reportAudioBlob.size > 0) {
                el.audioRecStatus.textContent = "Préécoute prête";
            } else if (isConstitution) {
                el.audioRecStatus.textContent = "Appuie pour enregistrer ton témoignage vocal";
            }
        }
    }

    function stopReportAudioRecording() {
        if (S.reportAudioRecorder && S.reportAudioRecorder.state !== "inactive") {
            S.reportAudioRecorder.stop();
        }
        if (S.reportAudioStream) {
            S.reportAudioStream.getTracks().forEach((t) => t.stop());
            S.reportAudioStream = null;
        }
        S.reportAudioRecording = false;
        stopReportAudioWaveform();
    }

    function resetRecordedAudio() {
        stopReportAudioRecording();
        S.reportAudioBlob = null;
        S.reportAudioChunks = [];
        if (el.reportAudioPreview) {
            el.reportAudioPreview.pause();
            el.reportAudioPreview.removeAttribute("src");
            el.reportAudioPreview.load();
            el.reportAudioPreview.style.display = "none";
        }
        resetReportAudioUI();
        syncReportAudioComposer();
    }

    function closeFeedReactionRecorder() {
        if (S.feedReactionRecorder && S.feedReactionRecorder.state !== "inactive") {
            S.feedReactionRecorder.stop();
        }
        if (S.feedReactionStream) {
            S.feedReactionStream.getTracks().forEach((t) => t.stop());
            S.feedReactionStream = null;
        }
        if (S.feedReactionTimer) {
            window.clearInterval(S.feedReactionTimer);
            S.feedReactionTimer = null;
        }
    }

    async function startReportAudioRecording() {
        if (S.reportAudioRecording) return;
        if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("Audio non supporté sur ce navigateur.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            S.reportAudioStream = stream;
            S.reportAudioChunks = [];
            S.reportAudioBlob = null;
            if (el.reportAudioPreview) {
                el.reportAudioPreview.pause();
                el.reportAudioPreview.removeAttribute("src");
                el.reportAudioPreview.load();
                el.reportAudioPreview.style.display = "none";
            }
            if (el.audioWaveCanvas) el.audioWaveCanvas.classList.add("live");

            const recorder = new MediaRecorder(stream);
            S.reportAudioRecorder = recorder;
            S.reportAudioRecording = true;
            S.reportAudioSeconds = 0;
            if (el.audioRecStatus) el.audioRecStatus.textContent = "Enregistrement en cours...";
            if (el.audioRecDot) el.audioRecDot.classList.add("recording");
            if (el.audioRecTimer) el.audioRecTimer.textContent = "00:00";

            stopReportAudioTimer();
            S.reportAudioTimer = window.setInterval(() => {
                S.reportAudioSeconds += 1;
                if (el.audioRecTimer) el.audioRecTimer.textContent = formatTimer(S.reportAudioSeconds);
                if (S.reportAudioSeconds >= 60) {
                    showToast("Limite audio atteinte (60s).");
                    stopReportAudioRecording();
                }
            }, 1000);

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                S.reportAudioContext = new AudioCtx();
                S.reportAudioAnalyser = S.reportAudioContext.createAnalyser();
                S.reportAudioAnalyser.fftSize = 256;
                S.reportAudioWaveData = new Uint8Array(S.reportAudioAnalyser.frequencyBinCount);
                S.reportAudioSource = S.reportAudioContext.createMediaStreamSource(stream);
                S.reportAudioSource.connect(S.reportAudioAnalyser);
                drawReportAudioWaveform();
            }

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) S.reportAudioChunks.push(event.data);
            };
            recorder.onstop = () => {
                const mime = recorder.mimeType || "audio/webm";
                S.reportAudioBlob = new Blob(S.reportAudioChunks, { type: mime });
                if (el.reportAudioPreview && S.reportAudioBlob.size > 0) {
                    el.reportAudioPreview.src = URL.createObjectURL(S.reportAudioBlob);
                    el.reportAudioPreview.style.display = "block";
                }
                if (S.reportAudioStream) {
                    S.reportAudioStream.getTracks().forEach((t) => t.stop());
                    S.reportAudioStream = null;
                }
                S.reportAudioRecording = false;
                if (el.audioRecStatus) el.audioRecStatus.textContent = "Enregistrement terminé";
                if (el.audioRecDot) el.audioRecDot.classList.remove("recording");
                stopReportAudioTimer();
                stopReportAudioWaveform();
                syncReportAudioComposer();
            };
            recorder.start();
        } catch (_e) {
            showToast("Autorise le micro pour enregistrer l'audio.");
            resetReportAudioUI();
            syncReportAudioComposer();
        }
    }

    function clearMediaPreview() {
        stopReportAudioRecording();
        resetReportAudioUI();
        S.reportAudioBlob = null;
        S.reportAudioChunks = [];
        el.photoPreview.classList.remove("show");
        el.photoPreview.src = "";
        el.videoPreview.pause();
        el.videoPreview.removeAttribute("src");
        el.videoPreview.load();
        el.videoPreview.classList.remove("show");
        if (el.reportAudioPreview) {
            el.reportAudioPreview.pause();
            el.reportAudioPreview.removeAttribute("src");
            el.reportAudioPreview.load();
            el.reportAudioPreview.style.display = "none";
        }
        el.cameraIcon.style.display = "block";
        el.videoDurationInput.value = "";
        stopReportAudioWaveform();
        syncReportAudioComposer();
    }

    function setMediaMode(mode) {
        el.mediaTypeInput.value = mode;
        el.mediaModeButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mediaMode === mode));
        el.cameraIcon.textContent = mode === "video" ? "▶" : (mode === "audio" ? "🎙️" : "📷");
        if (mode === "audio") {
            el.photoOrb.style.display = "none";
            if (el.audioRecorderBox) el.audioRecorderBox.classList.add("active");
            if (el.audioRecStatus) {
                el.audioRecStatus.textContent = "Autorise le micro puis démarre (max 60s)";
            }
        } else {
            el.photoOrb.style.display = "flex";
            if (el.audioRecorderBox) el.audioRecorderBox.classList.remove("active");
        }
        el.photoOrb.setAttribute("for", mode === "video" ? "video-input" : "photo-input");
        clearMediaPreview();
        el.photoInput.value = "";
        el.videoInput.value = "";
        if (el.audioInput) el.audioInput.value = "";
        syncReportAudioComposer();
    }

    function syncDataSaverButton() {
        if (!el.dataSaverBtn) return;
        el.dataSaverBtn.classList.toggle("active", S.dataSaverEnabled);
        el.dataSaverBtn.textContent = S.dataSaverEnabled ? "ON" : "OFF";
        el.dataSaverBtn.disabled = S.dataSaverForced;
        el.dataSaverBtn.style.opacity = S.dataSaverForced ? "0.7" : "1";
        if (S.dataSaverForced && S.dataSaverEnabled) {
            el.dataSaverBtn.textContent = "ON AUTO";
        }
    }

    function setDataSaver(enabled, persist) {
        S.dataSaverEnabled = Boolean(enabled);
        if (persist !== false) {
            localStorage.setItem("kolona_data_saver", S.dataSaverEnabled ? "1" : "0");
        }
        syncDataSaverButton();
    }

    function getNetworkProfile() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return { label: "Réseau: inconnu", slow: false };
        const type = String(conn.effectiveType || "").toLowerCase();
        const down = Number(conn.downlink || 0);
        const saveData = Boolean(conn.saveData);
        const slow = saveData || type === "slow-2g" || type === "2g" || down > 0 && down < 1.2;
        const labelType = type ? type.toUpperCase() : "N/A";
        const label = "Réseau: " + labelType + (saveData ? " • DataSaver" : "");
        return { label: label, slow: slow };
    }

    function applyNetworkPolicy() {
        const profile = getNetworkProfile();
        if (el.networkBadge) {
            el.networkBadge.textContent = profile.label;
        }
        if (profile.slow) {
            S.dataSaverForced = true;
            if (!S.dataSaverEnabled) {
                setDataSaver(true, false);
            } else {
                syncDataSaverButton();
            }
            if (!S.networkForcedNotified) {
                showToast("Réseau lent détecté: Économie de données forcée ON.");
                S.networkForcedNotified = true;
            }
        } else {
            S.dataSaverForced = false;
            syncDataSaverButton();
        }
    }

    function chooseRecorderMime() {
        if (!window.MediaRecorder || !window.MediaRecorder.isTypeSupported) return "";
        const candidates = [
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm"
        ];
        return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
    }

    function chooseAudioRecorderMime() {
        if (!window.MediaRecorder || !window.MediaRecorder.isTypeSupported) return "";
        const candidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus"
        ];
        return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
    }

    function readVideoMeta(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            const url = URL.createObjectURL(file);
            video.preload = "metadata";
            video.onloadedmetadata = () => {
                const meta = {
                    width: Number(video.videoWidth || 0),
                    height: Number(video.videoHeight || 0),
                    duration: Number(video.duration || 0)
                };
                URL.revokeObjectURL(url);
                resolve(meta);
            };
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("meta"));
            };
            video.src = url;
        });
    }

    async function compressVideoForMobile(file) {
        const mimeType = chooseRecorderMime();
        if (!file || !mimeType) return { file: file, compressed: false };
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
            return { file: file, compressed: false };
        }

        const srcUrl = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.src = srcUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        const meta = await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => resolve({
                width: Number(video.videoWidth || 0),
                height: Number(video.videoHeight || 0),
                duration: Number(video.duration || 0)
            });
            video.onerror = () => reject(new Error("video-load"));
        });

        const maxWidth = 720;
        const scale = meta.width > maxWidth ? (maxWidth / meta.width) : 1;
        const width = Math.max(240, Math.round(meta.width * scale));
        const height = Math.max(180, Math.round(meta.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        const stream = canvas.captureStream(20);
        const chunks = [];
        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 550_000
        });

        let rafId = null;
        const draw = () => {
            if (video.paused || video.ended) return;
            ctx.drawImage(video, 0, 0, width, height);
            rafId = window.requestAnimationFrame(draw);
        };

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const done = new Promise((resolve, reject) => {
            recorder.onstop = resolve;
            recorder.onerror = () => reject(new Error("recorder"));
        });

        recorder.start(200);
        video.onplay = () => draw();
        await video.play();

        const stopTimer = window.setTimeout(() => {
            try {
                if (recorder.state !== "inactive") recorder.stop();
            } catch (_e) {}
        }, Math.max(5000, Math.round((meta.duration || 10) * 1200)));

        await new Promise((resolve) => {
            video.onended = resolve;
        });

        if (rafId) window.cancelAnimationFrame(rafId);
        try {
            if (recorder.state !== "inactive") recorder.stop();
        } catch (_e) {}
        await done;
        window.clearTimeout(stopTimer);
        stream.getTracks().forEach((t) => t.stop());
        URL.revokeObjectURL(srcUrl);

        const outBlob = new Blob(chunks, { type: mimeType });
        if (!outBlob.size || outBlob.size >= file.size * 0.97) {
            return { file: file, compressed: false };
        }

        const base = (file.name || "video").replace(/\.[a-z0-9]+$/i, "");
        const outFile = new File([outBlob], base + ".webm", { type: outBlob.type });
        return { file: outFile, compressed: true };
    }

    async function compressAudioForMobile(blob) {
        if (!blob || !blob.size) return { blob: blob, compressed: false };
        if (!window.MediaRecorder || !window.AudioContext) return { blob: blob, compressed: false };
        const mimeType = chooseAudioRecorderMime();
        if (!mimeType) return { blob: blob, compressed: false };

        const ctx = new AudioContext();
        try {
            const buffer = await blob.arrayBuffer();
            const decoded = await ctx.decodeAudioData(buffer.slice(0));
            const source = ctx.createBufferSource();
            source.buffer = decoded;
            const gain = ctx.createGain();
            gain.gain.value = 0.9;
            const dest = ctx.createMediaStreamDestination();
            source.connect(gain);
            gain.connect(dest);

            const chunks = [];
            const recorder = new MediaRecorder(dest.stream, {
                mimeType: mimeType,
                audioBitsPerSecond: 22000,
            });
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            const done = new Promise((resolve, reject) => {
                recorder.onstop = resolve;
                recorder.onerror = () => reject(new Error("audio-compress"));
            });

            recorder.start(250);
            source.start(0);
            source.onended = () => {
                try {
                    if (recorder.state !== "inactive") recorder.stop();
                } catch (_e) {}
            };

            await done;
            const outBlob = new Blob(chunks, { type: mimeType });
            if (!outBlob.size || outBlob.size >= blob.size * 0.98) {
                return { blob: blob, compressed: false };
            }
            return { blob: outBlob, compressed: true };
        } catch (_e) {
            return { blob: blob, compressed: false };
        } finally {
            ctx.close().catch(() => {});
        }
    }

    function renderNotifications() {
        if (!el.notifList) return;
        const items = S.notifications.slice(0, 8).map((n) => {
            const when = new Date(n.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return '<li class="notif-item"><strong>' + esc(when) + "</strong><br>" + esc(n.message) + "</li>";
        });
        el.notifList.innerHTML = items.join("") || '<li class="notif-item">Aucune notification.</li>';
        el.notifDot.classList.toggle("show", S.unreadNotifications > 0);
        if (el.profileAlertDot) {
            el.profileAlertDot.classList.toggle("show", S.unreadNotifications > 0);
        }
        if (el.notifBtn) {
            el.notifBtn.classList.toggle("show-bell", S.unreadNotifications > 0);
            if (S.unreadNotifications <= 0) {
                el.notifPanel.classList.remove("open");
            }
        }
    }

    function addNotification(message, unread) {
        S.notifications.unshift({ message: message, at: new Date() });
        S.notifications = S.notifications.slice(0, 25);
        if (unread) S.unreadNotifications += 1;
        renderNotifications();
    }

    function getDeviceId() {
        const key = "kolona_device_id";
        let value = localStorage.getItem(key);
        if (!value) {
            value = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : "device-" + Date.now();
            localStorage.setItem(key, value);
        }
        return value;
    }

    function isStandaloneApp() {
        return Boolean(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone);
    }

    function hideInstallGate(persistDismissal) {
        if (persistDismissal) {
            try { window.localStorage.setItem("semachat_install_gate_seen", "1"); } catch (_e) {}
        }
        document.body.classList.remove("app-install-locked");
        if (el.installGate) {
            el.installGate.classList.remove("open");
            el.installGate.setAttribute("aria-hidden", "true");
        }
    }

    function showInstallGate() {
        if (isStandaloneApp() || !el.installGate) return;
        document.body.classList.add("app-install-locked");
        el.installGate.classList.add("open");
        el.installGate.setAttribute("aria-hidden", "false");
    }

    function sanitizeRoomSegment(value) {
        return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "zone";
    }

    function currentGeoSource() {
        if (
            S.selectedNeighborhoodZone
            && Number.isFinite(Number(S.selectedNeighborhoodZone.lat))
            && Number.isFinite(Number(S.selectedNeighborhoodZone.lng))
        ) {
            return { lat: Number(S.selectedNeighborhoodZone.lat), lng: Number(S.selectedNeighborhoodZone.lng) };
        }
        if (S.mapSearchAnchor && Number.isFinite(Number(S.mapSearchAnchor.lat)) && Number.isFinite(Number(S.mapSearchAnchor.lng))) {
            return { lat: Number(S.mapSearchAnchor.lat), lng: Number(S.mapSearchAnchor.lng) };
        }
        if (S.currentCoords && Number.isFinite(Number(S.currentCoords.lat)) && Number.isFinite(Number(S.currentCoords.lng))) {
            return { lat: Number(S.currentCoords.lat), lng: Number(S.currentCoords.lng) };
        }
        return null;
    }

    function nearestNeighborhoodLabel(coords) {
        const near = namedAreaNear(coords);
        if (!near || !near.area) {
            return {
                name: "Zone locale",
                provinceKey: "",
                kind: "Quartier",
                shortLabel: "Zone locale"
            };
        }
        return {
            name: near.area.name,
            provinceKey: near.area.provinceKey || "",
            kind: near.area.kind || "Quartier",
            shortLabel: near.area.name
        };
    }

    function namedAreaNear(coords) {
        if (!coords) return null;
        let best = null;
        let bestDistance = Infinity;
        SEARCH_AREAS.forEach((area) => {
            if (area.kind === "Province") return;
            const distance = haversineMeters(coords.lat, coords.lng, Number(area.lat), Number(area.lng));
            if (distance < bestDistance) {
                bestDistance = distance;
                best = area;
            }
        });
        if (!best) return null;
        return {
            area: best,
            distance: bestDistance
        };
    }

    function buildCircleRoom(coords) {
        if (!coords) return null;
        const bucketRadiusKm = S.selectedNeighborhoodZone ? (LOCAL_CHAT_RADIUS_M / 1000) : CIRCLE_RADIUS_KM;
        const latStep = bucketRadiusKm / 111;
        const lngStep = bucketRadiusKm / (111 * Math.max(Math.cos((coords.lat * Math.PI) / 180), 0.2));
        const latBucket = Math.round(coords.lat / latStep);
        const lngBucket = Math.round(coords.lng / lngStep);
        const near = namedAreaNear(coords);
        const labelBase = near && near.area ? near.area.name : "ta zone";
        const kind = near && near.area ? near.area.kind : "Cercle";
        return {
            key: "circle-" + latBucket + "-" + lngBucket,
            label: "Cercle de " + labelBase,
            shortLabel: labelBase,
            provinceKey: near && near.area ? (near.area.provinceKey || "") : "",
            kind: kind,
            lat: coords.lat,
            lng: coords.lng
        };
    }

    function drawNeighborhoodCircle(coords) {
        if (!coords) return;
        const latlng = [Number(coords.lat), Number(coords.lng)];
        if (S.neighborhoodCircleLayer) {
            S.neighborhoodCircleLayer.setLatLng(latlng);
            S.neighborhoodCircleLayer.setRadius(LOCAL_CHAT_RADIUS_M);
        } else {
            S.neighborhoodCircleLayer = L.circle(latlng, {
                radius: LOCAL_CHAT_RADIUS_M,
                color: "#3bb8ff",
                fillColor: "rgba(59, 184, 255, 0.18)",
                fillOpacity: 0.24,
                weight: 2.4,
                interactive: false
            }).addTo(map);
        }
    }

    function syncNeighborhoodComposer() {
        const enabled = Boolean(S.activeNeighborhoodRoom);
        const body = String((el.neighborhoodChatInput && el.neighborhoodChatInput.value) || "").trim();
        if (el.neighborhoodChatInput) {
            el.neighborhoodChatInput.disabled = !enabled;
            el.neighborhoodChatInput.placeholder = enabled ? "Écris au quartier..." : "Choisis un quartier sur la carte...";
        }
        if (el.neighborhoodChatSendBtn) {
            el.neighborhoodChatSendBtn.disabled = !enabled || !body;
        }
    }

    function selectNeighborhoodZone(coords, options) {
        if (!coords) return;
        const source = options && options.source ? options.source : "map";
        const label = nearestNeighborhoodLabel(coords);
        S.selectedNeighborhoodZone = {
            lat: Number(coords.lat),
            lng: Number(coords.lng),
            source: source,
            areaName: label.name,
            provinceKey: label.provinceKey || "",
            kind: label.kind || "Quartier"
        };
        drawNeighborhoodCircle(S.selectedNeighborhoodZone);
        refreshNeighborhoodChatButton();
        syncNeighborhoodComposer();
        if (el.neighborhoodChatPanel && !el.neighborhoodChatPanel.classList.contains("open")) {
            el.neighborhoodChatPanel.classList.add("open");
        }
        if (options && options.flyTo) {
            map.flyTo([Number(coords.lat), Number(coords.lng)], Math.max(map.getZoom(), 15), { duration: 0.9, easeLinearity: 0.25 });
        }
    }

    function realtimeSocketUrl() {
        const proto = window.location.protocol === "https:" ? "wss://" : "ws://";
        const roomKey = S.activeNeighborhoodRoom && S.activeNeighborhoodRoom.key ? S.activeNeighborhoodRoom.key : "";
        const params = new URLSearchParams({
            device_hash: getDeviceId(),
            room_key: roomKey
        });
        return proto + window.location.host + "/ws/semachat/?" + params.toString();
    }

    function notifyVibration(pattern) {
        if (navigator.vibrate) navigator.vibrate(pattern || [90, 45, 90]);
    }

    function isSignalementNearCurrentCircle(item) {
        const source = currentGeoSource();
        if (!source) return true;
        const lat = Number(item && item.lat);
        const lng = Number(item && item.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        return haversineMeters(source.lat, source.lng, lat, lng) <= (CIRCLE_RADIUS_KM * 1000);
    }

    function handleRealtimeMessage(type, payload) {
        if (type === "signalement.created" && payload && payload.signalement) {
            if (isSignalementNearCurrentCircle(payload.signalement)) {
                showMessageNotice("Nouvelle alerte", "Un nouveau point vient d'apparaître dans ton cercle.");
                notifyLocal("Nouvelle alerte proche sur SemaChat.");
                notifyVibration([80, 40, 120]);
            }
            loadSignalements();
            loadFeedData();
            return;
        }
        if (type === "social.direct_message" && payload && payload.message) {
            const message = payload.message;
            showMessageNotice("Sema privé", (message.author_label || "Un allié") + " t'a écrit.");
            notifyLocal((message.author_label || "Un allié") + " t'a écrit sur SemaChat.");
            notifyVibration([90, 45, 90]);
            if (S.activeDirectChatHash && String(message.sender_hash || "") === String(S.activeDirectChatHash)) {
                loadDirectChat();
            }
            return;
        }
        if (type === "social.room_message" && payload && payload.message) {
            const message = payload.message;
            showMessageNotice("Cercle local", (message.author_label || "Un voisin") + " parle dans " + (message.room_label || "ton cercle") + ".");
            notifyLocal("Nouveau message dans " + (message.room_label || "ton cercle local") + ".");
            notifyVibration(70);
            if (
                el.neighborhoodChatList
                && S.activeNeighborhoodRoom
                && String(message.room_key || "").toLowerCase() === String(S.activeNeighborhoodRoom.key || "").toLowerCase()
            ) {
                appendChatMessage(el.neighborhoodChatList, message);
            } else {
                loadNeighborhoodChat();
            }
            return;
        }
        if (type === "room.sent" && payload && payload.message) {
            if (payload.room && payload.room.slug) {
                S.activeNeighborhoodRoom = Object.assign({}, S.activeNeighborhoodRoom || {}, {
                    key: payload.room.slug,
                    label: payload.room.label || (S.activeNeighborhoodRoom && S.activeNeighborhoodRoom.label) || "",
                    provinceKey: payload.room.province_key || "",
                    kind: payload.room.kind || ""
                });
            }
            if (el.neighborhoodChatList) appendChatMessage(el.neighborhoodChatList, payload.message);
            return;
        }
        if (type === "social.notification") {
            loadServerNotifications(false);
            return;
        }
        if (type === "admin.intervention" && payload && payload.broadcast) {
            showAdminBanner(payload.broadcast);
            notifyLocal(payload.broadcast.message || "Intervention prioritaire SemaChat");
            notifyVibration([120, 60, 120, 60, 120]);
            return;
        }
        if (type === "admin.broadcast_comment" && payload && payload.comment) {
            if (S.activeBroadcastThreadId && Number(payload.broadcast_id || 0) === Number(S.activeBroadcastThreadId)) {
                loadBroadcastThread(S.activeBroadcastThreadId);
            }
            return;
        }
        if (type === "admin.broadcast_stats" && payload && payload.broadcast) {
            S.lastAdminPayload = Object.assign({}, S.lastAdminPayload || {}, payload.broadcast);
            renderAdminBroadcastMarker(S.lastAdminPayload);
            if (S.activeBroadcastThreadId && Number(payload.broadcast.id || 0) === Number(S.activeBroadcastThreadId)) {
                loadBroadcastThread(S.activeBroadcastThreadId);
            }
        }
    }

    function subscribeRealtimeRoom() {
        if (!S.realtimeSocket || S.realtimeSocket.readyState !== window.WebSocket.OPEN) return;
        S.realtimeSocket.send(JSON.stringify({
            action: "subscribe_room",
            room_key: S.activeNeighborhoodRoom && S.activeNeighborhoodRoom.key ? S.activeNeighborhoodRoom.key : ""
        }));
    }

    function connectRealtime() {
        if (!("WebSocket" in window)) return;
        if (S.realtimeSocket && (S.realtimeSocket.readyState === window.WebSocket.OPEN || S.realtimeSocket.readyState === window.WebSocket.CONNECTING)) {
            return;
        }
        try {
            const socket = new window.WebSocket(realtimeSocketUrl());
            S.realtimeSocket = socket;
            socket.addEventListener("open", () => {
                if (S.realtimeReconnectTimer) {
                    window.clearTimeout(S.realtimeReconnectTimer);
                    S.realtimeReconnectTimer = 0;
                }
                subscribeRealtimeRoom();
            });
            socket.addEventListener("message", (event) => {
                try {
                    const data = JSON.parse(String(event.data || "{}"));
                    handleRealtimeMessage(String(data.type || ""), data.payload || {});
                } catch (_e) {}
            });
            socket.addEventListener("close", () => {
                S.realtimeSocket = null;
                if (!S.realtimeReconnectTimer) {
                    S.realtimeReconnectTimer = window.setTimeout(() => {
                        S.realtimeReconnectTimer = 0;
                        connectRealtime();
                    }, REALTIME_RECONNECT_MS);
                }
            });
            socket.addEventListener("error", () => {
                try { socket.close(); } catch (_e) {}
            });
        } catch (_e) {}
    }

    function toUint8Array(base64) {
        const padding = "=".repeat((4 - (base64.length % 4)) % 4);
        const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
        const raw = window.atob(normalized);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
        return out;
    }

    function readSeenBroadcastIds() {
        try {
            const raw = window.localStorage.getItem("seen_broadcasts");
            const items = JSON.parse(raw || "[]");
            if (!Array.isArray(items)) return [];
            return items
                .map((item) => Number(item))
                .filter((item, index, list) => Number.isFinite(item) && item > 0 && list.indexOf(item) === index)
                .slice(-80);
        } catch (_e) {
            return [];
        }
    }

    function writeSeenBroadcastIds(ids) {
        try {
            window.localStorage.setItem("seen_broadcasts", JSON.stringify((Array.isArray(ids) ? ids : []).slice(-80)));
        } catch (_e) {}
    }

    function isBroadcastSeen(broadcastId) {
        const id = Number(broadcastId || 0);
        if (!id) return false;
        return readSeenBroadcastIds().includes(id);
    }

    function markBroadcastSeen(broadcastId) {
        const id = Number(broadcastId || 0);
        if (!id) return;
        const seen = readSeenBroadcastIds();
        if (seen.includes(id)) return;
        seen.push(id);
        writeSeenBroadcastIds(seen);
    }

    function closeAdminBanner() {
        if (!el.adminBroadcastBanner) return;
        markBroadcastSeen(S.lastAdminBroadcastId || (S.lastAdminPayload && S.lastAdminPayload.id));
        el.adminBroadcastBanner.setAttribute("aria-hidden", "true");
        el.adminBroadcastBanner.classList.add("closing");
        window.setTimeout(() => {
            if (!el.adminBroadcastBanner) return;
            el.adminBroadcastBanner.classList.remove("open", "urgent", "closing");
        }, 280);
    }

    function extractGpsFromMessage(message) {
        const txt = String(message || "");
        let lat = null;
        let lng = null;

        const labeled = txt.match(/lat(?:itude)?\s*[:=]\s*(-?\d+(?:\.\d+)?)[^\d-]{1,20}(?:lng|lon|long|longitude)\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
        if (labeled) {
            lat = Number(labeled[1]);
            lng = Number(labeled[2]);
        } else {
            const pair = txt.match(/(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)/);
            if (pair) {
                lat = Number(pair[1]);
                lng = Number(pair[2]);
            }
        }

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
        return { lat: lat, lng: lng };
    }

    function adminBroadcastCoords(payload) {
        const lat = Number(payload && payload.lat);
        const lng = Number(payload && payload.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat: lat, lng: lng };
        return extractGpsFromMessage((payload && payload.message) || "");
    }

    function clearAdminBroadcastMarker() {
        if (S.adminBroadcastMarker && map.hasLayer(S.adminBroadcastMarker)) {
            map.removeLayer(S.adminBroadcastMarker);
        }
        S.adminBroadcastMarker = null;
        if (S.adminBroadcastCircle && map.hasLayer(S.adminBroadcastCircle)) {
            map.removeLayer(S.adminBroadcastCircle);
        }
        S.adminBroadcastCircle = null;
    }

    function buildAdminBroadcastIcon(totalResponses) {
        return L.divIcon({
            className: "",
            html: '<div class="admin-marker-shell"><div class="admin-marker-core">🟣</div><span class="vote-badge">' + Math.min(Number(totalResponses || 0), 99) + "</span></div>",
            iconSize: [52, 52],
            iconAnchor: [26, 26],
            popupAnchor: [0, -18]
        });
    }

    function adminBroadcastPopupHtml(payload) {
        const total = Number(payload && payload.total_responses || 0);
        const yes = Number(payload && payload.yes_count || 0);
        const no = Number(payload && payload.no_count || 0);
        const confirmCount = Number(payload && payload.confirm_count || 0);
        const disagreeCount = Number(payload && payload.disagree_count || 0);
        const question = String((payload && payload.question) || (payload && payload.message) || "Sondage admin");
        return (
            '<div class="popup-card admin-survey">' +
            '<h3 class="popup-card-title">Sondage Admin</h3>' +
            '<p class="admin-survey-question">' + esc(question) + "</p>" +
            '<p class="popup-card-meta">' + yes + " Oui • " + no + " Non • " + total + " réponses</p>" +
            '<div class="admin-survey-actions">' +
            '<button class="admin-survey-btn yes" data-admin-survey-answer="YES" data-broadcast-id="' + Number(payload && payload.id || 0) + '">Oui</button>' +
            '<button class="admin-survey-btn no" data-admin-survey-answer="NO" data-broadcast-id="' + Number(payload && payload.id || 0) + '">Non</button>' +
            '<button class="admin-survey-btn" data-open-broadcast-thread="' + Number(payload && payload.id || 0) + '">Commentaires</button>' +
            "</div>" +
            '<p class="popup-card-meta">' + confirmCount + " confirment • " + disagreeCount + " pas d'accord</p>" +
            "</div></div>"
        );
    }

    function renderAdminBroadcastCircle(payload, coords) {
        if (!coords) return;
        const state = String((payload && payload.consensus_state) || "stable").toLowerCase();
        const isCritical = state === "critical";
        const isWarning = state === "warning";
        const color = isCritical ? "#ff5252" : (isWarning ? "#ffb347" : "#19f39a");
        const fillColor = isCritical ? "rgba(255, 82, 82, 0.22)" : (isWarning ? "rgba(255, 179, 71, 0.20)" : "rgba(25, 243, 154, 0.16)");
        const radius = Math.max(1800, CIRCLE_RADIUS_KM * 1000);
        if (S.adminBroadcastCircle) {
            S.adminBroadcastCircle.setLatLng([coords.lat, coords.lng]);
            S.adminBroadcastCircle.setStyle({
                color: color,
                fillColor: fillColor,
                fillOpacity: isCritical ? 0.3 : (isWarning ? 0.24 : 0.18),
                weight: isCritical ? 3 : (isWarning ? 2.6 : 2)
            });
            S.adminBroadcastCircle.setRadius(radius);
        } else {
            S.adminBroadcastCircle = L.circle([coords.lat, coords.lng], {
                radius: radius,
                color: color,
                fillColor: fillColor,
                fillOpacity: isCritical ? 0.3 : (isWarning ? 0.24 : 0.18),
                weight: isCritical ? 3 : (isWarning ? 2.6 : 2),
                interactive: false
            }).addTo(map);
        }
    }

    function renderBroadcastThreadComments(comments) {
        if (!el.broadcastThreadComments) return;
        const rows = Array.isArray(comments) ? comments : [];
        if (!rows.length) {
            el.broadcastThreadComments.innerHTML = '<li class="broadcast-thread-comment"><div class="broadcast-thread-body">Aucun commentaire pour le moment.</div></li>';
            return;
        }
        el.broadcastThreadComments.innerHTML = rows.map((item) => (
            '<li class="broadcast-thread-comment' + (item.is_mine ? ' mine' : '') + '">' +
            '<div class="broadcast-thread-author">' + esc(item.author_label || "SemaCitoyen") + '</div>' +
            '<div class="broadcast-thread-body">' + esc(item.body || "") + '</div>' +
            '<div class="broadcast-thread-time">' + esc(formatChatTime(item.created_at)) + '</div>' +
            '</li>'
        )).join("");
        el.broadcastThreadComments.scrollTop = el.broadcastThreadComments.scrollHeight;
    }

    function syncBroadcastReactionButtons(payload) {
        if (!el.broadcastConfirmBtn || !el.broadcastDisagreeBtn) return;
        const my = String(payload && payload.my_reaction || "");
        const confirmCount = Number(payload && payload.confirm_count || 0);
        const disagreeCount = Number(payload && payload.disagree_count || 0);
        el.broadcastConfirmBtn.classList.toggle("active", my === "CONFIRM");
        el.broadcastDisagreeBtn.classList.toggle("active", my === "DISAGREE");
        el.broadcastConfirmBtn.textContent = "Je confirme ✅ (" + confirmCount + ")";
        el.broadcastDisagreeBtn.textContent = "Pas d'accord ❌ (" + disagreeCount + ")";
    }

    function closeBroadcastThread() {
        if (!el.broadcastThreadPanel) return;
        el.broadcastThreadPanel.classList.remove("open");
        S.activeBroadcastThreadId = 0;
    }

    async function loadBroadcastThread(broadcastId) {
        if (!broadcastId) return;
        try {
            const params = new URLSearchParams({
                broadcast_id: String(broadcastId),
                device_hash: getDeviceId()
            });
            const res = await fetch("/api/admin-broadcast/thread/?" + params.toString(), { credentials: "same-origin" });
            const payload = await res.json();
            if (!res.ok) throw new Error("thread");
            if (payload && payload.broadcast) {
                S.lastAdminPayload = Object.assign({}, S.lastAdminPayload || {}, payload.broadcast);
                if (el.broadcastThreadTitle) el.broadcastThreadTitle.textContent = payload.broadcast.title || payload.broadcast.question || "Alerte citoyenne";
                if (el.broadcastThreadMeta) {
                    el.broadcastThreadMeta.textContent =
                        Number(payload.broadcast.total_responses || 0) + " votes • " +
                        Number(payload.broadcast.confirm_count || 0) + " confirmations";
                }
                syncBroadcastReactionButtons(payload.broadcast);
                renderAdminBroadcastMarker(S.lastAdminPayload);
            }
            renderBroadcastThreadComments(payload && payload.comments ? payload.comments : []);
        } catch (_e) {
            renderBroadcastThreadComments([]);
        }
    }

    function openBroadcastThread(broadcastId) {
        const id = Number(broadcastId || (S.lastAdminPayload && S.lastAdminPayload.id) || 0);
        if (!id || !el.broadcastThreadPanel) return;
        S.activeBroadcastThreadId = id;
        el.broadcastThreadPanel.classList.add("open");
        loadBroadcastThread(id);
    }

    async function sendBroadcastComment() {
        if (!S.activeBroadcastThreadId || !el.broadcastThreadInput) return;
        const body = String(el.broadcastThreadInput.value || "").trim();
        if (!body) return;
        try {
            const res = await fetch("/api/admin-broadcast/thread/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({
                    broadcast_id: S.activeBroadcastThreadId,
                    unique_device_id: getDeviceId(),
                    body: body
                })
            });
            const payload = await res.json();
            if (!res.ok) throw new Error((payload && payload.detail) || "comment");
            el.broadcastThreadInput.value = "";
            await loadBroadcastThread(S.activeBroadcastThreadId);
        } catch (_e) {
            showToast("Commentaire indisponible pour le moment.");
        }
    }

    async function reactBroadcast(kind) {
        if (!S.activeBroadcastThreadId) return;
        try {
            const res = await fetch("/api/admin-broadcast/react/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({
                    broadcast_id: S.activeBroadcastThreadId,
                    unique_device_id: getDeviceId(),
                    kind: kind
                })
            });
            const payload = await res.json();
            if (!res.ok) throw new Error("broadcast-react");
            S.lastAdminPayload = Object.assign({}, S.lastAdminPayload || {}, payload);
            syncBroadcastReactionButtons(payload);
            renderAdminBroadcastMarker(S.lastAdminPayload);
        } catch (_e) {
            showToast("Réaction indisponible.");
        }
    }

    function renderAdminBroadcastMarker(payload) {
        if (!payload || !payload.id) {
            clearAdminBroadcastMarker();
            if (el.surveyBanner) el.surveyBanner.style.display = "flex";
            return;
        }

        const coords = adminBroadcastCoords(payload) || { lat: DEFAULT_MAP_CENTER[0], lng: DEFAULT_MAP_CENTER[1] };
        const popup = adminBroadcastPopupHtml(payload);
        if (S.adminBroadcastMarker) {
            S.adminBroadcastMarker.setLatLng([coords.lat, coords.lng]);
            S.adminBroadcastMarker.setIcon(buildAdminBroadcastIcon(payload.total_responses));
            S.adminBroadcastMarker.setPopupContent(popup);
        } else {
            S.adminBroadcastMarker = L.marker([coords.lat, coords.lng], {
                icon: buildAdminBroadcastIcon(payload.total_responses),
                riseOnHover: true
            });
            S.adminBroadcastMarker.bindPopup(popup, { className: "glass-popup", maxWidth: 260 });
            S.adminBroadcastMarker.addTo(map);
        }
        S.adminBroadcastMarker.off("click");
        S.adminBroadcastMarker.on("click", () => openBroadcastThread(Number(payload.id || 0)));
        renderAdminBroadcastCircle(payload, coords);
        if (payload.kind === "SURVEY" && el.surveyBanner) {
            el.surveyBanner.style.display = "none";
        }
    }

    function openMapFromBroadcast() {
        closeKnowledgePanel();
        closeFeedPanel();
        closeStatsPanel();
        if (el.navMapBtn) el.navMapBtn.click();
        map.invalidateSize();

        const coords = adminBroadcastCoords(S.lastAdminPayload);
        if (coords) {
            map.flyTo([coords.lat, coords.lng], Math.max(15, map.getZoom()), { duration: 0.9, easeLinearity: 0.25 });
            if (S.adminBroadcastMarker) S.adminBroadcastMarker.openPopup();
        }
    }

    function showAdminBanner(payload) {
        if (!el.adminBroadcastBanner || !payload || !payload.message) return;
        const message = String(payload.message || "").trim();
        const priority = String(payload.priority || "INFO").toUpperCase();
        const id = Number(payload.id || payload.broadcast_id || 0);
        const isSameBroadcast = Boolean(id && id === S.lastAdminBroadcastId);
        S.lastAdminPayload = {
            id: id,
            title: payload.title || "",
            message: message,
            priority: priority,
            kind: payload.kind || "ALERT",
            question: payload.question || "",
            lat: payload.lat,
            lng: payload.lng,
            yes_count: Number(payload.yes_count || 0),
            no_count: Number(payload.no_count || 0),
            total_responses: Number(payload.total_responses || 0),
            confirm_count: Number(payload.confirm_count || 0),
            disagree_count: Number(payload.disagree_count || 0),
            my_reaction: payload.my_reaction || "",
            critical_circle: Boolean(payload.critical_circle)
        };
        renderAdminBroadcastMarker(S.lastAdminPayload);
        if (id && isBroadcastSeen(id)) {
            S.lastAdminBroadcastId = id;
            if (el.adminBroadcastBanner.classList.contains("open")) closeAdminBanner();
            return;
        }
        if (id) S.lastAdminBroadcastId = id;
        el.adminBroadcastMessage.textContent = message;
        el.adminBroadcastBanner.setAttribute("aria-hidden", "false");
        el.adminBroadcastBanner.classList.remove("closing");
        el.adminBroadcastBanner.classList.toggle("urgent", priority === "URGENT");
        el.adminBroadcastBanner.classList.add("open");
        if (isSameBroadcast) return;
        document.body.classList.remove("shake-ui");
        void document.body.offsetWidth;
        document.body.classList.add("shake-ui");
        window.setTimeout(() => document.body.classList.remove("shake-ui"), 420);
    }

    function showPollSignalementBanner(item) {
        if (!el.adminBroadcastBanner || !item || !item.id) return;
        const id = Number(item.id || 0);
        const isSame = id === S.lastPollSignalementId;
        S.lastPollSignalementId = id;
        el.adminBroadcastMessage.textContent = "Sondage Admin • " + (item.title || "Question citoyenne");
        el.adminBroadcastBanner.setAttribute("aria-hidden", "false");
        el.adminBroadcastBanner.classList.remove("closing", "urgent");
        el.adminBroadcastBanner.classList.add("open");
        if (isSame) return;
        document.body.classList.remove("shake-ui");
        void document.body.offsetWidth;
        document.body.classList.add("shake-ui");
        window.setTimeout(() => document.body.classList.remove("shake-ui"), 420);
    }

    async function pollLatestAdminBroadcast() {
        try {
            const params = new URLSearchParams({ device_hash: getDeviceId() });
            const res = await fetch("/api/admin-broadcast/latest/?" + params.toString(), { credentials: "same-origin" });
            if (!res.ok) throw new Error("broadcast");
            const data = await res.json();
            if (data && data.id) {
                showAdminBanner({
                    id: data.id,
                    title: data.title,
                    message: data.message,
                    kind: data.kind,
                    question: data.question,
                    lat: data.lat,
                    lng: data.lng,
                    yes_count: data.yes_count,
                    no_count: data.no_count,
                    total_responses: data.total_responses,
                    confirm_count: data.confirm_count,
                    disagree_count: data.disagree_count,
                    my_reaction: data.my_reaction,
                    critical_circle: data.critical_circle,
                    priority: data.priority || "INFO",
                });
            } else {
                clearAdminBroadcastMarker();
            }
        } catch (_e) {}
    }

    async function pollLatestPollSignalement() {
        try {
            const res = await fetch("/api/signalements/latest-poll/", { credentials: "same-origin" });
            if (!res.ok) throw new Error("latest-poll");
            const data = await res.json();
            if (data && data.id) {
                const entry = findEntry(data.id);
                if (entry) {
                    entry.data = Object.assign({}, entry.data, data);
                    refreshEntry(entry);
                }
                showPollSignalementBanner(data);
            }
        } catch (_e) {}
    }

    async function setupPushNotifications() {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const existing = await reg.pushManager.getSubscription();
            if (existing) return;

            const keyRes = await fetch("/api/push/public-key/", { credentials: "same-origin" });
            if (!keyRes.ok) return;
            const keyPayload = await keyRes.json();
            const publicKey = keyPayload.vapid_public_key || "";
            if (!publicKey) return;

            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: toUint8Array(publicKey),
            });
            const json = sub.toJSON();
            await fetch("/api/push/subscribe/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") || "" },
                body: JSON.stringify({
                    endpoint: json.endpoint,
                    p256dh: (json.keys && json.keys.p256dh) || "",
                    auth: (json.keys && json.keys.auth) || "",
                    device_hash: getDeviceId(),
                }),
            });
        } catch (_e) {}
    }

    async function fetchSocialProfile(targetHash, consumeCelebration) {
        const self = getDeviceId();
        const params = new URLSearchParams({
            viewer_hash: self,
            target_hash: targetHash || self
        });
        if (consumeCelebration) params.set("consume_celebration", "1");
        const res = await fetch("/api/social/profile/?" + params.toString(), { credentials: "same-origin" });
        if (!res.ok) throw new Error("social-profile");
        return res.json();
    }

    async function loadSelfProfile() {
        try {
            const data = await fetchSocialProfile(getDeviceId(), true);
            const beforeLevel = Number(S.level || 1);
            S.points = Number(data.points || 0);
            S.level = Number(data.level || 1);
            S.profileRank = data.rank_title || "Citoyen Novice";
            S.knowledgeContributionCount = Number(data.knowledge_contribution_count || 0);
            if (el.profileName) {
                el.profileName.textContent = data.display_name || displayNameFromHash(data.device_hash || getDeviceId());
            }
            if (el.profileRank) {
                el.profileRank.innerHTML = renderProfileRankBadge(S.profileRank);
            }
            if (el.knowledgeBadge) {
                el.knowledgeBadge.style.display = data.reliability_badge ? "inline-flex" : "none";
                el.knowledgeBadge.textContent = data.reliability_badge || "Éclaireur";
            }
            if (el.avatarLevelBadge) {
                el.avatarLevelBadge.textContent = String(S.level || 1);
            }
            persistReputationState();
            syncProfileStats();
            if (data.celebration_pending && data.celebration_message) {
                if (el.levelupText) {
                    el.levelupText.textContent = data.celebration_message;
                }
                if (el.levelupModal) {
                    el.levelupModal.classList.add("open");
                    window.setTimeout(() => el.levelupModal.classList.remove("open"), 2600);
                }
            } else if (S.level > beforeLevel) {
                showLevelUp(S.level);
            }
        } catch (_e) {}
    }

    async function loadServerNotifications(markRead) {
        try {
            const params = new URLSearchParams({ device_hash: getDeviceId() });
            if (markRead) params.set("mark_read", "1");
            const res = await fetch("/api/social/notifications/?" + params.toString(), {
                credentials: "same-origin"
            });
            if (!res.ok) throw new Error("social-notifications");
            const items = await res.json();
            S.notifications = items.map((item) => ({
                id: item.id,
                message: item.message,
                at: item.created_at,
                is_read: Boolean(item.is_read)
            }));
            S.unreadNotifications = S.notifications.filter((x) => !x.is_read).length;
            const unreadItems = S.notifications.filter((x) => !x.is_read && x.at);
            if (!markRead && unreadItems.length) {
                if (!S.lastNotifiedNotificationAt) {
                    S.lastNotifiedNotificationAt = unreadItems[0].at;
                } else {
                    const fresh = unreadItems.filter((x) => String(x.at) > String(S.lastNotifiedNotificationAt)).sort((a, b) => String(a.at).localeCompare(String(b.at)));
                    if (fresh.length) {
                        const latest = fresh[fresh.length - 1];
                        S.lastNotifiedNotificationAt = latest.at;
                        showMessageNotice("Notification Sema", latest.message || "Une nouvelle alerte t'attend.");
                        notifyLocal(latest.message || "Nouvelle notification SemaChat");
                        if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
                    }
                }
            }
            renderNotifications();
        } catch (_e) {}
    }

    async function pollSocialMessages() {
        try {
            const params = new URLSearchParams({ device_hash: getDeviceId() });
            if (S.activeNeighborhoodRoom && S.activeNeighborhoodRoom.key) {
                params.set("room_key", S.activeNeighborhoodRoom.key);
            }
            if (S.latestMessageSeenAt) {
                params.set("since", S.latestMessageSeenAt);
            }
            const res = await fetch("/api/social/messages/updates/?" + params.toString(), {
                credentials: "same-origin"
            });
            if (!res.ok) throw new Error("updates");
            const payload = await res.json();
            const directMessages = Array.isArray(payload.direct_messages) ? payload.direct_messages : [];
            const roomMessages = Array.isArray(payload.room_messages) ? payload.room_messages : [];
            const incomingDirect = directMessages.filter((msg) => !msg.is_mine);
            const incomingRoom = roomMessages.filter((msg) => !msg.is_mine);

            if (incomingDirect.length) {
                const latest = incomingDirect[incomingDirect.length - 1];
                addNotification("Sema privé: " + (latest.author_label || "Allié"), true);
                showMessageNotice("Sema privé", (latest.author_label || "Un allié") + " t'a écrit.");
                notifyLocal((latest.author_label || "Un allié") + " t'a écrit sur SemaChat.");
                if (navigator.vibrate) navigator.vibrate([90, 45, 90]);
                if (S.activeDirectChatHash && String(latest.sender_hash || "") === String(S.activeDirectChatHash)) {
                    loadDirectChat();
                }
            }
            if (incomingRoom.length) {
                const latestRoom = incomingRoom[incomingRoom.length - 1];
                showMessageNotice("Salon local", (latestRoom.author_label || "Un voisin") + " a parlé dans " + (latestRoom.room_label || "le quartier") + ".");
                notifyLocal("Nouveau message dans " + (latestRoom.room_label || "ton cercle local") + ".");
                if (navigator.vibrate) navigator.vibrate(70);
                if (el.neighborhoodChatPanel && el.neighborhoodChatPanel.classList.contains("open")) {
                    loadNeighborhoodChat();
                }
            }

            const allDates = directMessages.concat(roomMessages).map((msg) => String(msg.created_at || "")).filter(Boolean).sort();
            if (allDates.length) {
                S.latestMessageSeenAt = allDates[allDates.length - 1];
            }
        } catch (_e) {}
    }

    function getVisual(category) {
        return V[category] || { icon: "\uD83D\uDCCD", className: "pin-default", label: category || "Categorie" };
    }

    function isDebateCategory(category) {
        return category === "CONSTITUTION" || category === "POLITIQUE";
    }

    function isGoogleConnected() {
        return document.body && document.body.dataset && document.body.dataset.authenticated === "1";
    }

    function getStatus(votes) {
        if (votes > 50) return { label: "Résolu", css: "resolved" };
        if (votes >= 15) return { label: "Pris en compte", css: "review" };
        return { label: "En attente", css: "pending" };
    }

    function getSignalementStatus(statusValue) {
        const value = String(statusValue || "PENDING").toUpperCase();
        if (value === "RESOLVED") return { label: "Résolu", css: "resolved" };
        if (value === "VALIDATED") return { label: "Vérifié", css: "review" };
        return { label: "Signalé", css: "pending" };
    }

    function renderProfileRankBadge(rank) {
        const label = String(rank || "Bronze").trim().toUpperCase();
        return '<span class="reputation-badge"><span class="rank-icon">🏅</span><span>' + esc(label) + "</span></span>";
    }

    function haversineMeters(lat1, lng1, lat2, lng2) {
        const r = 6371000;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2
            + Math.cos(lat1 * (Math.PI / 180))
            * Math.cos(lat2 * (Math.PI / 180))
            * Math.sin(dLng / 2) ** 2;
        return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    function isLive(createdAt) {
        if (!createdAt) return false;
        const ageMs = Date.now() - new Date(createdAt).getTime();
        return ageMs >= 0 && ageMs < 60 * 60 * 1000;
    }

    function truncateText(text, maxChars) {
        const clean = String(text || "").trim();
        if (clean.length <= maxChars) {
            return { short: clean, full: clean, truncated: false };
        }
        return { short: clean.slice(0, maxChars).trimEnd() + "...", full: clean, truncated: true };
    }

    function isAllied(hash) {
        return Boolean(hash && S.allies[hash]);
    }

    function isFollowing(hash) {
        return Boolean(hash && S.follows[hash]);
    }

    function followerCount(hash) {
        const base = (shortHash(hash).charCodeAt(0) || 65) + (shortHash(hash).charCodeAt(1) || 66);
        const bonus = isFollowing(hash) ? 1 : 0;
        return 20 + (base % 80) + bonus;
    }

    function closeSocialProfile() {
        if (!el.socialProfileModal) return;
        el.socialProfileModal.classList.remove("open");
        S.activeSocialHash = "";
    }

    function closeDirectChat() {
        if (!el.directChatPanel) return;
        el.directChatPanel.classList.remove("open");
        S.activeDirectChatHash = "";
        S.activeDirectChatName = "";
    }

    function closeNeighborhoodChat() {
        if (!el.neighborhoodChatPanel) return;
        el.neighborhoodChatPanel.classList.remove("open");
    }

    async function loadDirectChat() {
        if (!S.activeDirectChatHash || !el.directChatList) return;
        try {
            const params = new URLSearchParams({
                actor_hash: getDeviceId(),
                target_hash: S.activeDirectChatHash
            });
            const res = await fetch("/api/social/messages/direct/?" + params.toString(), {
                credentials: "same-origin"
            });
            const payload = await res.json();
            if (!res.ok) throw new Error((payload && payload.detail) || "chat");
            renderChatList(el.directChatList, payload, "Aucun message privé pour le moment.");
            if (el.directChatTitle) el.directChatTitle.textContent = "Sema privé";
            if (el.directChatSubtitle) el.directChatSubtitle.textContent = "Conversation avec " + (S.activeDirectChatName || "ton allié");
        } catch (error) {
            renderChatList(el.directChatList, [], error.message || "Chat indisponible.");
        }
    }

    function openDirectChat(hash, name) {
        if (!hash || !el.directChatPanel) return;
        closeSocialProfile();
        S.activeDirectChatHash = hash;
        S.activeDirectChatName = name || "ton allié";
        el.directChatPanel.classList.add("open");
        loadDirectChat();
    }

    async function sendDirectChatMessage() {
        if (!S.activeDirectChatHash || !el.directChatInput) return;
        const body = String(el.directChatInput.value || "").trim();
        if (!body) {
            showToast("Écris un message avant d'envoyer.");
            return;
        }
        try {
            const res = await fetch("/api/social/messages/direct/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({
                    actor_hash: getDeviceId(),
                    target_hash: S.activeDirectChatHash,
                    body: body
                })
            });
            const payload = await res.json();
            if (!res.ok) throw new Error((payload && payload.detail) || "chat");
            el.directChatInput.value = "";
            await loadDirectChat();
        } catch (error) {
            showToast(error.message || "Chat privé indisponible.");
        }
    }

    async function loadNeighborhoodChat() {
        if (!S.activeNeighborhoodRoom || !el.neighborhoodChatList) {
            renderChatList(el.neighborhoodChatList, [], "Choisis une zone pour ouvrir le salon local.");
            return;
        }
        try {
            const params = new URLSearchParams({
                room_key: S.activeNeighborhoodRoom.key,
                viewer_hash: getDeviceId(),
                room_label: S.activeNeighborhoodRoom.label || "",
                province_key: S.activeNeighborhoodRoom.provinceKey || ""
            });
            const res = await fetch("/api/social/messages/room/?" + params.toString(), {
                credentials: "same-origin"
            });
            const payload = await res.json();
            if (!res.ok) throw new Error("room");
            const room = payload && payload.room ? payload.room : null;
            const messages = payload && Array.isArray(payload.messages) ? payload.messages : [];
            if (room && room.label) {
                S.activeNeighborhoodRoom = {
                    key: room.slug || S.activeNeighborhoodRoom.key,
                    label: room.label,
                    provinceKey: room.province_key || "",
                    kind: room.kind || ""
                };
                if (el.neighborhoodChatTitle) {
                    el.neighborhoodChatTitle.textContent = "Cercle du quartier : " + ((S.selectedNeighborhoodZone && S.selectedNeighborhoodZone.areaName) || room.label);
                }
                if (el.neighborhoodChatSubtitle) {
                    el.neighborhoodChatSubtitle.textContent = "Salon " + ((room.kind || "local").toLowerCase()) + " lié à ta zone actuelle (500 m).";
                }
            }
            renderChatList(el.neighborhoodChatList, messages, "Aucun message dans ce salon pour le moment.");
        } catch (_e) {
            renderChatList(el.neighborhoodChatList, [], "Salon indisponible pour le moment.");
        }
    }

    async function sendNeighborhoodChatMessage() {
        if (!S.activeNeighborhoodRoom || !el.neighborhoodChatInput) {
            showToast("Choisis d'abord une zone de discussion.");
            return;
        }
        const body = String(el.neighborhoodChatInput.value || "").trim();
        if (!body) {
            syncNeighborhoodComposer();
            showToast("Écris un message avant d'envoyer.");
            return;
        }
        const payload = {
            circle_id: sanitizeRoomSegment((S.activeNeighborhoodRoom && S.activeNeighborhoodRoom.key) || ""),
            room_key: S.activeNeighborhoodRoom.key,
            room_label: S.activeNeighborhoodRoom.label,
            province_key: S.activeNeighborhoodRoom.provinceKey || "",
            sender_hash: getDeviceId(),
            body: body
        };
        try {
            if (S.realtimeSocket && S.realtimeSocket.readyState === window.WebSocket.OPEN) {
                S.realtimeSocket.send(JSON.stringify(Object.assign({ action: "send_room_message" }, payload)));
                console.log("Message envoyé !", payload);
                el.neighborhoodChatInput.value = "";
                syncNeighborhoodComposer();
                return;
            }
            const res = await fetch("/api/social/messages/room/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify(payload)
            });
            const response = await res.json();
            if (!res.ok) throw new Error((response && response.detail) || "room");
            console.log("Message envoyé !", payload);
            el.neighborhoodChatInput.value = "";
            syncNeighborhoodComposer();
            if (response && response.room) {
                S.activeNeighborhoodRoom = {
                    key: response.room.slug || S.activeNeighborhoodRoom.key,
                    label: response.room.label || S.activeNeighborhoodRoom.label,
                    provinceKey: response.room.province_key || "",
                    kind: response.room.kind || ""
                };
            }
            await loadNeighborhoodChat();
        } catch (error) {
            showToast(error.message || "Salon indisponible.");
        }
    }

    function applyProfileDrawerMode(isSelf, profile) {
        if (el.changeProfilePhotoBtn) el.changeProfilePhotoBtn.style.display = isSelf ? "block" : "none";
        if (el.myReportsBtn) el.myReportsBtn.style.display = isSelf ? "block" : "none";
        if (el.profileAllyBtn) el.profileAllyBtn.style.display = isSelf ? "none" : "block";
        if (el.profileFollowBtn) el.profileFollowBtn.style.display = isSelf ? "none" : "block";

        if (!isSelf && profile) {
            const allied = Boolean(profile.is_allied);
            const following = Boolean(profile.is_following);
            if (el.profileAllyBtn) {
                el.profileAllyBtn.textContent = allied ? "Demande envoyée" : "Devenir Allié";
                el.profileAllyBtn.disabled = allied;
                el.profileAllyBtn.classList.toggle("sent", allied);
            }
            if (el.profileFollowBtn) {
                el.profileFollowBtn.textContent = following ? "Suivi ✓" : "Suivre";
                el.profileFollowBtn.disabled = false;
            }
        }
    }

    async function openProfileDrawerFor(hash) {
        const selfHash = getDeviceId();
        const targetHash = hash || selfHash;
        const isSelf = targetHash === selfHash;
        S.viewedProfileHash = targetHash;
        if (isSelf) setBottomNavActive("user");

        el.menuDrawer.classList.remove("open");
        el.profileDrawer.classList.add("open");
        el.drawerBackdrop.classList.add("open");
        closeSocialProfile();

        try {
            const profile = await fetchSocialProfile(targetHash, false);
            if (el.profileName) {
                el.profileName.textContent = profile.display_name || displayNameFromHash(targetHash);
            }
            if (el.profileRank) {
                el.profileRank.innerHTML = renderProfileRankBadge(profile.rank_title || "Citoyen Novice");
            }

            if (isSelf) {
                await loadSelfProfile();
            } else {
                const lv = pointsToNextLevel(Number(profile.points || 0));
                if (el.profileLevelBadge) {
                    el.profileLevelBadge.textContent = "Level " + Number(profile.level || lv.level);
                }
                if (el.profileLevelTitle) {
                    el.profileLevelTitle.textContent = "Progression vers Level " + (Number(profile.level || lv.level) + 1);
                }
                if (el.profileLevelFill) {
                    el.profileLevelFill.style.width = Math.max(0, Math.min(100, Math.round((lv.inLevel / lv.need) * 100))) + "%";
                }
                if (el.profileLevelMeta) {
                    el.profileLevelMeta.textContent = lv.inLevel + " / " + lv.need + " points";
                }
                if (el.totalReports) el.totalReports.textContent = "—";
                if (el.sessionReports) el.sessionReports.textContent = "—";
                if (el.knowledgeCount) el.knowledgeCount.textContent = "—";
            }

            applyProfileDrawerMode(isSelf, profile);
        } catch (_e) {
            applyProfileDrawerMode(isSelf, null);
        }
    }

    async function openSocialProfile(hash) {
        if (!hash || !el.socialProfileModal || !el.socialProfileBody) return;
        S.activeSocialHash = hash;
        el.socialProfileBody.innerHTML = '<div class="mini-profile-meta">Chargement...</div>';
        el.socialProfileModal.classList.add("open");

        let profile = null;
        try {
            profile = await fetchSocialProfile(hash, false);
        } catch (_e) {}

        const following = profile ? Boolean(profile.is_following) : isFollowing(hash);
        const allied = profile ? Boolean(profile.is_allied) : isAllied(hash);
        if (following) S.follows[hash] = true;
        else delete S.follows[hash];
        if (allied) S.allies[hash] = true;
        else delete S.allies[hash];
        persistSocialState();

        const followers = profile ? Number(profile.followers_count || 0) : followerCount(hash);
        const rank = profile ? (profile.rank_title || "Citoyen Novice") : "Citoyen Novice";
        const level = profile ? Number(profile.level || 1) : 1;
        const name = profile && profile.display_name
            ? profile.display_name
            : displayNameFromHash(hash);
        const relationMeta = profile && profile.is_mutual_ally
            ? "Chat privé débloqué"
            : (allied ? "Alliance en cours" : "Ajoute-le comme allié");

        el.socialProfileBody.innerHTML =
            '<div class="mini-profile-row">' +
            '<div class="mini-profile-avatar">' + esc(initialsFromHash(hash)) + "</div>" +
            "<div>" +
            '<div style="font-weight:700;">' + esc(name) + "</div>" +
            '<div class="mini-profile-meta">' + followers + " abonnés • Level " + level + "</div>" +
            '<div class="mini-profile-meta">' + esc(rank) + " • " + esc(relationMeta) + "</div>" +
            "</div></div>" +
            '<div class="mini-social-actions">' +
            '<button class="mini-social-btn" id="social-follow-btn">' + (following ? "Suivi ✓" : "Suivre") + "</button>" +
            '<button class="mini-social-btn" id="social-ally-btn">' + (allied ? "Allié ✓" : "Devenir Allié") + "</button>" +
            (profile && profile.is_mutual_ally
                ? '<button class="mini-social-btn secondary" id="social-message-btn" data-target-name="' + esc(name) + '">Sema</button>'
                : "") +
            "</div>";
    }

    async function toggleFollow(hash) {
        if (!hash) return;
        try {
            const res = await fetch("/api/social/follow/toggle/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({ actor_hash: getDeviceId(), target_hash: hash })
            });
            if (!res.ok) throw new Error("follow");
            const data = await res.json();
            if (data.following) S.follows[hash] = true;
            else delete S.follows[hash];
            persistSocialState();
            openSocialProfile(hash);
        } catch (_e) {
            showToast("Action suivre indisponible.");
        }
    }

    async function toggleAlly(hash) {
        if (!hash) return;
        try {
            const res = await fetch("/api/social/ally/toggle/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({ actor_hash: getDeviceId(), target_hash: hash })
            });
            if (!res.ok) throw new Error("ally");
            const data = await res.json();
            if (data.allied) S.allies[hash] = true;
            else delete S.allies[hash];
            persistSocialState();
            openSocialProfile(hash);
            showToast(data.allied ? "Nouvel allié ajouté." : "Allié retiré.");
            loadFeedData();
            loadSignalements();
        } catch (_e) {
            showToast("Action allié indisponible.");
        }
    }

    async function sendAllyRequestFromDrawer(hash) {
        if (!hash) return;
        try {
            const res = await fetch("/api/social/ally/request/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({ actor_hash: getDeviceId(), target_hash: hash })
            });
            if (!res.ok) throw new Error("ally");
            S.allies[hash] = true;
            persistSocialState();
            if (el.profileAllyBtn) {
                el.profileAllyBtn.textContent = "Demande envoyée";
                el.profileAllyBtn.disabled = true;
                el.profileAllyBtn.classList.add("sent");
            }
            showToast("Demande d'alliance envoyée.");
            loadFeedData();
            loadSignalements();
        } catch (_e) {
            showToast("Impossible d'envoyer la demande allié.");
        }
    }

    async function toggleFollowFromDrawer(hash) {
        if (!hash) return;
        await toggleFollow(hash);
        try {
            const profile = await fetchSocialProfile(hash, false);
            if (el.profileFollowBtn) {
                el.profileFollowBtn.textContent = profile.is_following ? "Suivi ✓" : "Suivre";
            }
        } catch (_e) {}
    }

    function notifyAlliedImportantResources(resources) {
        const allies = Object.keys(S.allies).filter((h) => S.allies[h]);
        if (!allies.length || !Array.isArray(resources)) return;

        let newestTs = S.allyResourceSeenAt || 0;
        resources.forEach((r) => {
            const byAlly = allies.includes(String(r.contributor_hash || ""));
            if (!byAlly) return;
            const content = ((r.tags || "") + " " + (r.title || "") + " " + (r.content || "")).toLowerCase();
            const important = /important|urgent|priorit|critique/.test(content);
            if (!important) return;
            const ts = new Date(r.created_at).getTime();
            if (ts > (S.allyResourceSeenAt || 0)) {
                addNotification("Un allié a publié une ressource importante.", true);
                showToast("Allié: nouvelle ressource importante.");
            }
            if (ts > newestTs) newestTs = ts;
        });
        if (newestTs !== S.allyResourceSeenAt) {
            S.allyResourceSeenAt = newestTs;
            persistSocialState();
        }
    }

    function toggleFeedDescription(row, btn) {
        if (!row || !btn) return;
        const p = row.querySelector(".feed-description");
        if (!p) return;

        const shortText = p.getAttribute("data-short") || p.textContent || "";
        const fullText = p.getAttribute("data-full") || shortText;
        const expanded = btn.getAttribute("data-expanded") === "1";

        if (!expanded) {
            p.textContent = fullText;
            requestAnimationFrame(() => p.classList.add("expanded"));
            btn.textContent = "Voir moins ⬆️";
            btn.classList.add("less");
            btn.setAttribute("data-expanded", "1");
            return;
        }

        const list = el.feedList;
        const viewBottom = list.scrollTop + list.clientHeight;
        const rowBottom = row.offsetTop + row.offsetHeight;
        const shouldRecenter = viewBottom + 24 >= rowBottom;

        p.classList.remove("expanded");
        btn.textContent = "Voir plus";
        btn.classList.remove("less");
        btn.setAttribute("data-expanded", "0");

        window.setTimeout(() => {
            p.textContent = shortText;
            if (shouldRecenter) {
                list.scrollTo({ top: Math.max(0, row.offsetTop - 10), behavior: "smooth" });
            }
        }, 300);
    }

    function buildPollMarkerIcon(item) {
        const yes = Number(item && item.poll_yes_count || 0);
        const no = Number(item && item.poll_no_count || 0);
        const total = Number(item && item.poll_total_count || (yes + no) || 0);
        const mood = yes === no ? "" : (yes > no ? " poll-yes" : " poll-no");
        return L.divIcon({
            className: "",
            html: '<div class="admin-marker-shell"><div class="admin-marker-core signalement-poll' + mood + '">📢</div><span class="vote-badge">' + Math.min(total, 99) + "</span></div>",
            iconSize: [52, 52],
            iconAnchor: [26, 26],
            popupAnchor: [0, -18]
        });
    }

    function buildMarkerIcon(category, votes, item) {
        if (item && item.is_poll) return buildPollMarkerIcon(item);
        const vis = getVisual(category);
        const hot = votes > 10;
        const shell = hot ? "marker-shell high-pressure" : "marker-shell";
        const pin = hot ? "category-pin " + vis.className + " high-pressure" : "category-pin " + vis.className;
        return L.divIcon({
            className: "",
            html: '<div class="' + shell + '"><div class="' + pin + '">' + vis.icon + '</div><span class="vote-badge">' + Math.min(votes, 99) + "</span></div>",
            iconSize: hot ? [68, 68] : [34, 34],
            iconAnchor: hot ? [34, 34] : [17, 17],
            popupAnchor: [0, -16]
        });
    }

    function popupHtml(item) {
        if (item && item.is_poll) {
            const yes = Number(item.poll_yes_count || 0);
            const no = Number(item.poll_no_count || 0);
            const total = Number(item.poll_total_count || (yes + no) || 0);
            const yesPct = Number(item.poll_yes_percentage || 0);
            const noPct = Number(item.poll_no_percentage || 0);
            return (
                '<div class="popup-card admin-survey">' +
                '<h3 class="popup-card-title">Sondage Admin</h3>' +
                '<p class="admin-survey-question">' + esc(item.title || item.description || "Sondage") + "</p>" +
                '<p class="popup-card-meta">' + yesPct + "% disent Oui / " + noPct + "% disent Non</p>" +
                '<div class="admin-survey-meter" style="--yes:' + yesPct + '%;--no:' + noPct + '%;"><span class="admin-survey-meter-yes"></span><span class="admin-survey-meter-no"></span></div>' +
                '<p class="popup-card-meta">' + total + " réponses • " + yes + " Oui • " + no + " Non</p>" +
                '<div class="admin-survey-actions">' +
                '<button class="admin-survey-btn yes" data-poll-signalement-answer="YES" data-id="' + Number(item.id || 0) + '">Oui</button>' +
                '<button class="admin-survey-btn no" data-poll-signalement-answer="NO" data-id="' + Number(item.id || 0) + '">Non</button>' +
                "</div></div>"
            );
        }
        const vis = getVisual(item.category);
        const votes = Number(item.validation_count || 0);
        const status = getSignalementStatus(item.status);
        const author = displayAuthorLabel(item);
        const img = item.image ? '<img class="popup-card-img" src="' + esc(item.image) + '" alt="Photo signalement">' : "";
        const audio = item.audio ? customAudioPlayerHtml(item.audio, { signalementId: Number(item.id || 0), metaLabel: "Audio du signalement" }) : "";
        const debateBtn = isDebateCategory(item.category)
            ? '<button class="popup-action-btn debate-btn" data-id="' + Number(item.id || 0) + '">\uD83C\uDFA4 Prendre la parole</button>'
            : "";
        const supportCount = Number(item.support_count || 0);
        const compassionCount = Number(item.compassion_count || 0);
        const myMood = String(item.my_mood || "");
        return (
            '<div class="popup-card">' +
            '<h3 class="popup-card-title">' + esc(item.title) + "</h3>" +
            '<p class="popup-card-meta">' + esc(vis.label) + "</p>" +
            '<p class="popup-card-meta">' + esc(author) + "</p>" +
            '<span class="popup-status ' + status.css + '">' + status.label + "</span>" +
            img +
            audio +
            '<div class="popup-actions">' +
            '<button class="popup-action-btn vote-btn confirm-btn" data-id="' + Number(item.id || 0) + '">\u2714 Je confirme (' + votes + ")</button>" +
            '<button class="popup-action-btn mood-btn' + (myMood === "SUPPORT" ? " active" : "") + '" data-mood="SUPPORT" data-id="' + Number(item.id || 0) + '">\uD83D\uDC4D ' + supportCount + "</button>" +
            '<button class="popup-action-btn mood-btn sad' + (myMood === "SAD" ? " active" : "") + '" data-mood="SAD" data-id="' + Number(item.id || 0) + '">\uD83D\uDE22 ' + compassionCount + "</button>" +
            '<button class="popup-action-btn share-btn" data-id="' + Number(item.id || 0) + '">\u2197 Partager</button>' +
            '<button class="popup-action-btn abuse-btn" data-report-abuse-id="' + Number(item.id || 0) + '">⚠ Signaler un contenu inapproprié</button>' +
            debateBtn +
            "</div></div>"
        );
    }

    function findEntry(id) {
        return S.markerStore.find((e) => Number(e.data.id) === Number(id));
    }

    function setMarkerAudioPlayback(signalementId, isPlaying) {
        const entry = findEntry(signalementId);
        const markerEl = entry && entry.marker ? entry.marker.getElement() : null;
        const shell = markerEl ? markerEl.querySelector(".marker-shell") : null;
        if (shell) {
            shell.classList.toggle("audio-playing", Boolean(isPlaying));
        }
        if (isPlaying) {
            S.activeMarkerAudioId = Number(signalementId || 0);
        } else if (S.activeMarkerAudioId === Number(signalementId || 0)) {
            S.activeMarkerAudioId = 0;
        }
    }

    function refreshEntry(entry) {
        const votes = Number(entry.data.validation_count || 0);
        entry.marker.setIcon(buildMarkerIcon(entry.data.category, votes, entry.data));
        entry.marker.setPopupContent(popupHtml(entry.data));
    }

    function renderHeatmap() {
        S.tensionLayer.clearLayers();
        S.markerStore.forEach((entry) => {
            if (S.activeFilter !== "ALL" && entry.category !== S.activeFilter) return;
            const votes = Number(entry.data.validation_count || 0);
            const hot = votes > 50;
            const circle = L.circle([Number(entry.data.lat), Number(entry.data.lng)], {
                radius: 220 + votes * 16,
                color: hot ? "#ff4d72" : "#ff9c3d",
                fillColor: hot ? "#ff4d72" : "#ff9c3d",
                fillOpacity: Math.min(0.7, 0.2 + votes / 120),
                weight: 1.2
            });
            circle.addTo(S.tensionLayer);
        });
    }

    function setMarkerVisibility(entry, shouldShow) {
        if (!entry || !entry.marker) return;
        if (entry.hideTimer) {
            window.clearTimeout(entry.hideTimer);
            entry.hideTimer = null;
        }

        const exists = map.hasLayer(entry.marker);
        if (shouldShow) {
            if (!exists) entry.marker.addTo(map);
            window.requestAnimationFrame(() => {
                const markerEl = entry.marker.getElement();
                const shell = markerEl ? markerEl.querySelector(".marker-shell") : null;
                if (shell) shell.classList.remove("is-hidden");
            });
            return;
        }

        if (!exists) return;
        const markerEl = entry.marker.getElement();
        const shell = markerEl ? markerEl.querySelector(".marker-shell") : null;
        if (!shell) {
            map.removeLayer(entry.marker);
            return;
        }
        shell.classList.add("is-hidden");
        entry.hideTimer = window.setTimeout(() => {
            if (map.hasLayer(entry.marker)) map.removeLayer(entry.marker);
            entry.hideTimer = null;
        }, 220);
    }

    function applyFilter() {
        const visibleEntries = [];
        const now = Date.now();
        S.markerStore.forEach((entry) => {
            const createdAt = entry && entry.data && entry.data.created_at ? new Date(entry.data.created_at).getTime() : 0;
            const matchesTime = S.timeFilter === "48H"
                ? Boolean(createdAt && (now - createdAt) <= 48 * 60 * 60 * 1000)
                : true;
            const matchesSearch = matchesMapSearch(entry.data);
            const matchesAnchor = matchesMapAnchor(entry.data);
            const matchesProvince = matchesProvinceFilter(entry.data);
            const shouldShow = (S.activeFilter === "ALL" || entry.category === S.activeFilter) && matchesTime && matchesSearch && matchesAnchor && matchesProvince && !S.heatmapMode;
            setMarkerVisibility(entry, shouldShow);
            if (shouldShow) visibleEntries.push(entry);
        });

        if (S.heatmapMode) {
            renderHeatmap();
            if (!map.hasLayer(S.tensionLayer)) S.tensionLayer.addTo(map);
        } else if (map.hasLayer(S.tensionLayer)) {
            map.removeLayer(S.tensionLayer);
        }

        if (!S.heatmapMode && S.pendingMapFocusFilter === S.activeFilter) {
            if (visibleEntries.length) {
                const bounds = L.latLngBounds(
                    visibleEntries.map((entry) => entry.marker.getLatLng())
                );
                map.fitBounds(bounds, {
                    padding: [42, 42],
                    maxZoom: S.activeFilter === "ALL" ? 14 : 16,
                });
            } else if (S.activeFilter !== "ALL") {
                showToast(S.mapSearchQuery
                    ? "Aucune alerte ne correspond à cette recherche"
                    : "Aucune alerte dans cette catégorie pour le moment");
            }
            S.pendingMapFocusFilter = "";
        }
        syncMenuFilterState();
    }

    function syncMenuFilterState() {
        if (el.menuFilterButtons && el.menuFilterButtons.length) {
            el.menuFilterButtons.forEach((btn) => {
                btn.classList.toggle("active", btn.dataset.filter === S.activeFilter && !S.heatmapMode);
            });
        }
        if (el.heatmapToggleBtn) {
            el.heatmapToggleBtn.classList.toggle("heat-active", S.heatmapMode);
        }
    }

    function syncVoteCountAcrossUi(id, validationCount, status) {
        const numericId = Number(id || 0);
        const nextCount = Number(validationCount || 0);
        S.feedItems = S.feedItems.map((item) => {
            if (item.type === "alert" && Number(item.id || 0) === numericId) {
                return Object.assign({}, item, {
                    count: nextCount,
                    validation_count: nextCount,
                    status: status || item.status
                });
            }
            return item;
        });
        if (S.activeFeedDetailId === numericId) {
            const current = S.feedItems.find((item) => item.type === "alert" && Number(item.id || 0) === numericId);
            if (current) openFeedDetail(current);
        }
    }

    function syncPollDataAcrossUi(id, payload) {
        const numericId = Number(id || 0);
        const yesCount = Number(payload && payload.poll_yes_count || 0);
        const noCount = Number(payload && payload.poll_no_count || 0);
        const total = Number(payload && payload.poll_total_count || (yesCount + noCount) || 0);
        const yesPct = Number(payload && payload.poll_yes_percentage || 0);
        const noPct = Number(payload && payload.poll_no_percentage || 0);
        S.feedItems = S.feedItems.map((item) => {
            if (item.type === "alert" && Number(item.id || 0) === numericId) {
                return Object.assign({}, item, {
                    is_poll: true,
                    poll_yes_count: yesCount,
                    poll_no_count: noCount,
                    poll_total_count: total,
                    poll_yes_percentage: yesPct,
                    poll_no_percentage: noPct,
                });
            }
            return item;
        });
        const entry = findEntry(numericId);
        if (entry) {
            entry.data.is_poll = true;
            entry.data.poll_yes_count = yesCount;
            entry.data.poll_no_count = noCount;
            entry.data.poll_total_count = total;
            entry.data.poll_yes_percentage = yesPct;
            entry.data.poll_no_percentage = noPct;
            refreshEntry(entry);
        }
        if (S.activeFeedDetailId === numericId) {
            const current = S.feedItems.find((item) => item.type === "alert" && Number(item.id || 0) === numericId);
            if (current) openFeedDetail(current);
        }
    }

    function syncMoodDataAcrossUi(id, payload) {
        const numericId = Number(id || 0);
        const supportCount = Number(payload && payload.support_count || 0);
        const compassionCount = Number(payload && payload.compassion_count || 0);
        const myMood = String(payload && payload.my_mood || "");
        S.feedItems = S.feedItems.map((item) => {
            if (item.type === "alert" && Number(item.id || 0) === numericId) {
                return Object.assign({}, item, {
                    support_count: supportCount,
                    compassion_count: compassionCount,
                    my_mood: myMood,
                });
            }
            return item;
        });
        const entry = findEntry(numericId);
        if (entry) {
            entry.data.support_count = supportCount;
            entry.data.compassion_count = compassionCount;
            entry.data.my_mood = myMood;
            refreshEntry(entry);
        }
        if (S.activeFeedDetailId === numericId) {
            const current = S.feedItems.find((item) => item.type === "alert" && Number(item.id || 0) === numericId);
            if (current) openFeedDetail(current);
        }
    }

    function setBottomNavActive(key) {
        const states = [
            [el.navMapBtn, key === "map"],
            [el.navKnowledgeBtn, key === "knowledge"],
            [el.navFeedBtn, key === "feed"],
            [el.openProfileBtnBottom, key === "user"],
        ];
        states.forEach((entry) => {
            const node = entry[0];
            const active = entry[1];
            if (node) node.classList.toggle("active", active);
        });
    }

    function closeMenuDrawer() {
        el.menuDrawer.classList.remove("open");
        if (!el.profileDrawer.classList.contains("open")) el.drawerBackdrop.classList.remove("open");
    }

    function closeMenuDrawerWithDelay(delayMs) {
        window.setTimeout(() => {
            closeMenuDrawer();
        }, Math.max(0, Number(delayMs || 0)));
    }

    function closeMenuInfoModal() {
        if (!el.menuInfoModal) return;
        el.menuInfoModal.classList.remove("open");
        if (el.menuInfoBody) el.menuInfoBody.innerHTML = "";
    }

    function openMenuInfoModal(title, bodyHtml) {
        if (!el.menuInfoModal || !el.menuInfoTitle || !el.menuInfoBody) return;
        el.menuInfoTitle.textContent = title || "SemaChat";
        el.menuInfoBody.innerHTML = bodyHtml || "";
        el.menuInfoModal.classList.add("open");
    }

    function syncHistoryAudioBadge() {
        if (!el.menuLinkHistoryBadge) return;
        const seenTs = readHistoryAudioSeenTs();
        el.menuLinkHistoryBadge.classList.toggle("show", Number(S.latestHistoryAudioTs || 0) > Number(seenTs || 0));
    }

    function returnToDefaultMapView(options) {
        const opts = Object.assign({ resetSearch: true }, options);
        setBottomNavActive("map");
        closeKnowledgePanel();
        closeFeedPanel();
        closeStatsPanel();
        closeSocialProfile();
        closeFeedDetail();
        closeDebateModal();
        if (opts.resetSearch) {
            S.mapSearchQuery = "";
            S.mapSearchAnchor = null;
            S.provinceFilter = "";
            S.mapSearchSuggestions = [];
            if (el.mapSearchInput) el.mapSearchInput.value = "";
            renderMapSearchSuggestions();
            syncProvinceFilterUi();
            syncMapSearchUi();
            applyFilter();
        }
        map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { animate: true });
    }

    async function openGlobalHistoryModal() {
        openMenuInfoModal("Historique Global", '<div class="menu-info-card">Chargement des signalements recents...</div>');
        try {
            const res = await fetch("/api/signalements/", { credentials: "same-origin" });
            if (!res.ok) throw new Error("history-load");
            const rows = await res.json();
            const latestAudioTs = rows.reduce((acc, item) => {
                if (!item.audio || !item.created_at) return acc;
                const ts = new Date(item.created_at).getTime();
                return ts > acc ? ts : acc;
            }, 0);
            S.latestHistoryAudioTs = latestAudioTs;
            writeHistoryAudioSeenTs(latestAudioTs);
            syncHistoryAudioBadge();
            const html = rows.slice(0, 24).map((item) => {
                const category = getVisual(item.category).label || "Alerte";
                const author = displayAuthorLabel(item);
                const meta = [
                    category,
                    new Date(item.created_at).toLocaleString(),
                    author
                ].join(" • ");
                return (
                    '<li class="history-item">' +
                    '<p class="history-item-title">' + esc(item.title || "Signalement") + '</p>' +
                    '<p class="history-item-meta">' + esc(meta) + '</p>' +
                    '<p class="history-item-meta">' + esc(truncateText(item.description || "", 130).short || "Aucun detail.") + '</p>' +
                    '<button class="feed-action-btn history-share-btn" type="button" data-id="' + Number(item.id || 0) + '">Partager</button>' +
                    "</li>"
                );
            }).join("");
            openMenuInfoModal(
                "Historique Global",
                '<div class="menu-info-card"><ul class="history-list">' + (html || '<li class="history-item"><p class="history-item-title">Aucun signalement recent.</p></li>') + "</ul></div>"
            );
        } catch (_e) {
            openMenuInfoModal("Historique Global", '<div class="menu-info-card">Impossible de charger l\'historique pour le moment.</div>');
        }
    }

    function openHelpModal() {
        openMenuInfoModal(
            "Aide",
            '<div class="menu-info-step"><strong>1.</strong><span>Choisis une categorie</span></div>' +
            '<div class="menu-info-step"><strong>2.</strong><span>Enregistre ton audio</span></div>' +
            '<div class="menu-info-step"><strong>3.</strong><span>Publie sur la carte</span></div>'
        );
    }

    function openAboutModal() {
        openMenuInfoModal(
            "À propos",
            '<div class="menu-info-card">SemaChat est une plateforme citoyenne permettant aux étudiants et citoyens de signaler les enjeux de la Constitution, de l\'eau, de l\'énergie et de la sécurité par la voix. Pour que chaque voix compte dans le débat national.</div>'
        );
    }

    function filterMap(category) {
        S.heatmapMode = false;
        S.activeFilter = category || "ALL";
        S.pendingMapFocusFilter = S.activeFilter;
        applyFilter();
    }

    function setMapFilter(filter) {
        filterMap(filter);
            const label = S.activeFilter === "ALL"
            ? "toutes les alertes"
            : ("alertes " + ((getVisual(S.activeFilter).label) || "de cette catégorie"));
        showToast("Affichage des " + label, "filter-confirm");
        closeMenuDrawerWithDelay(300);
    }

    function addMarker(item, zoom) {
        const lat = Number(item.lat);
        const lng = Number(item.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const votes = Number(item.validation_count || 0);
        const marker = L.marker([lat, lng], { icon: buildMarkerIcon(item.category, votes, item), riseOnHover: true });
        marker.bindPopup(popupHtml(item), { className: "glass-popup", maxWidth: 240 });
        marker.on("click", () => map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.9, easeLinearity: 0.25 }));
        S.markerStore.push({ marker: marker, category: item.category || "", data: Object.assign({}, item) });
        applyFilter();
        if (S.pendingSharedFocusId && Number(item.id || 0) === Number(S.pendingSharedFocusId)) {
            map.flyTo([lat, lng], 16, { duration: 0.9, easeLinearity: 0.25 });
            marker.openPopup();
            S.pendingSharedFocusId = 0;
        }
        if (zoom && !S.heatmapMode) map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.9, easeLinearity: 0.25 });
    }

    async function voteSignalement(id) {
        const entry = findEntry(id);
        if (!entry) return;
        try {
            const res = await fetch("/api/signalements/" + id + "/validate/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") || "" },
                body: JSON.stringify({ unique_device_id: getDeviceId() })
            });
            if (!res.ok) throw new Error("vote");
            const payload = await res.json();
            entry.data.validation_count = Number(payload.validation_count || entry.data.validation_count || 0);
            if (payload.status) entry.data.status = payload.status;
            syncVoteCountAcrossUi(id, entry.data.validation_count, entry.data.status);
            if (payload.created) {
                S.voteFeedbackIds[String(id)] = true;
                window.setTimeout(() => {
                    delete S.voteFeedbackIds[String(id)];
                    renderFeed();
                    syncVoteCountAcrossUi(id, entry.data.validation_count, entry.data.status);
                }, 2000);
                renderFeed();
            }
            refreshEntry(entry);
            applyFilter();
            showToast(payload.created ? "Confirmation enregistrée." : "Confirmation déjà prise en compte.");
            loadSelfProfile();
        } catch (_e) {
            showToast("Vote impossible pour le moment.");
        }
    }

    async function reportSignalementAbuse(id) {
        const entry = findEntry(id);
        if (!entry) return;
        try {
            const res = await fetch("/api/signalements/" + Number(id) + "/report-abuse/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({ unique_device_id: getDeviceId() })
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload.detail || "abuse-report");
            }
            if (payload.hidden) {
                closeFeedDetail();
                await loadSignalements();
                await loadFeedData();
                showToast("Signalement masqué en attente de validation.");
                return;
            }
            showToast(payload.created ? "Signalement transmis à la modération." : "Tu as déjà signalé ce contenu.");
        } catch (error) {
            showToast(error && error.message && error.message !== "abuse-report"
                ? error.message
                : "Signalement d'abus indisponible.");
        }
    }

    async function reactSignalementMood(id, mood) {
        const entry = findEntry(id);
        if (!entry) return;
        try {
            const res = await fetch("/api/signalements/" + Number(id) + "/mood/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") || "" },
                body: JSON.stringify({ unique_device_id: getDeviceId(), mood: mood })
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.detail || "mood");
            syncMoodDataAcrossUi(id, payload);
            renderFeed();
            showToast(payload.removed ? "Réaction retirée." : "Réaction enregistrée.");
        } catch (_e) {
            showToast("Réaction indisponible pour le moment.");
        }
    }

    async function submitSignalementPollVote(id, answer) {
        const entry = findEntry(id);
        if (!entry || !entry.data || !entry.data.is_poll) return;
        try {
            const res = await fetch("/api/signalements/" + id + "/poll-vote/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") || "" },
                body: JSON.stringify({ unique_device_id: getDeviceId(), answer: answer })
            });
            if (!res.ok) throw new Error("poll-vote");
            const payload = await res.json();
            if (payload.created) {
                S.pollFeedbackIds[String(id)] = answer;
                window.setTimeout(() => {
                    delete S.pollFeedbackIds[String(id)];
                    renderFeed();
                }, 2000);
            }
            syncPollDataAcrossUi(id, payload);
            renderFeed();
            showToast(payload.created ? "Vote sondage enregistré." : "Tu as déjà répondu à ce sondage.");
        } catch (_e) {
            showToast("Vote sondage impossible.");
        }
    }

    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    async function buildShareBlob(item) {
        const c = document.createElement("canvas");
        c.width = 1080;
        c.height = 1350;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#0c1d38";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#14335f";
        ctx.fillRect(40, 40, c.width - 80, c.height - 80);
        ctx.fillStyle = "#5ed8ff";
        ctx.font = "bold 52px Segoe UI";
        ctx.fillText("SemaChat", 90, 140);
        ctx.fillStyle = "#d8ebff";
        ctx.font = "bold 44px Segoe UI";
        ctx.fillText(item.title || "Signalement", 90, 230);
        const votes = Number(item.validation_count || 0);
        ctx.font = "28px Segoe UI";
        ctx.fillStyle = "#9ed1ff";
        ctx.fillText("Categorie: " + getVisual(item.category).label, 90, 300);
        ctx.fillText("Votes: " + votes, 90, 345);
        ctx.fillText("Statut: " + getStatus(votes).label, 90, 390);
        ctx.fillText("Lieu: " + item.lat + ", " + item.lng, 90, 435);
        ctx.fillText("Date: " + new Date().toLocaleString(), 90, 480);

        if (item.image) {
            try {
                const img = await loadImage(item.image);
                ctx.drawImage(img, 90, 520, 900, 700);
            } catch (_e) {
                ctx.fillText("Photo indisponible pour rendu", 90, 560);
            }
        }

        return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
    }

    async function shareSignalement(id) {
        const entry = findEntry(id);
        if (!entry) return;
        shareSignalementViaWhatsApp(entry.data);
    }

    function stopDebateRecording() {
        if (S.debateRecorder && S.debateRecorder.state !== "inactive") {
            S.debateRecorder.stop();
        }
        if (S.debateMicStream) {
            S.debateMicStream.getTracks().forEach((t) => t.stop());
            S.debateMicStream = null;
        }
        S.debateIsRecording = false;
        if (el.debateRecordBtn) {
            el.debateRecordBtn.textContent = "🎙️ Enregistrer";
        }
    }

    async function toggleDebateRecording() {
        if (!el.debateRecordBtn) return;
        if (S.debateIsRecording) {
            stopDebateRecording();
            return;
        }
        if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("Enregistrement vocal non supporté sur ce navigateur.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            S.debateMicStream = stream;
            S.debateRecordChunks = [];
            const recorder = new MediaRecorder(stream);
            S.debateRecorder = recorder;
            S.debateIsRecording = true;
            el.debateRecordBtn.textContent = "⏹️ Stop";

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) S.debateRecordChunks.push(event.data);
            };
            recorder.onstop = () => {
                const mime = recorder.mimeType || "audio/webm";
                S.debateAudioBlob = new Blob(S.debateRecordChunks, { type: mime });
                if (el.debateAudioPreview) {
                    el.debateAudioPreview.src = URL.createObjectURL(S.debateAudioBlob);
                    el.debateAudioPreview.style.display = "block";
                }
                stopDebateRecording();
            };
            recorder.start();
            window.setTimeout(() => {
                if (S.debateIsRecording) stopDebateRecording();
            }, 45000);
        } catch (_e) {
            showToast("Micro inaccessible.");
            stopDebateRecording();
        }
    }

    function tryTranscribeDebate() {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
            showToast("Transcription indisponible sur ce navigateur.");
            return;
        }
        const recognition = new Recognition();
        recognition.lang = "fr-FR";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
            const text = event.results && event.results[0] && event.results[0][0]
                ? String(event.results[0][0].transcript || "").trim()
                : "";
            if (!text) return;
            if (el.debateText) {
                const current = String(el.debateText.value || "").trim();
                el.debateText.value = current ? (current + "\n" + text) : text;
            }
            showToast("Transcription ajoutée.");
        };
        recognition.onerror = () => showToast("Transcription impossible.");
        recognition.start();
    }

    function resetDebateComposer() {
        S.debateAudioBlob = null;
        S.debateRecordChunks = [];
        stopDebateRecording();
        if (el.debateAudioPreview) {
            el.debateAudioPreview.pause();
            el.debateAudioPreview.removeAttribute("src");
            el.debateAudioPreview.load();
            el.debateAudioPreview.style.display = "none";
        }
        if (el.debateForm) el.debateForm.reset();
        if (el.debateSideInput) el.debateSideInput.value = "LEGAL";
        if (el.debateSideButtons) {
            el.debateSideButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.side === "LEGAL"));
        }
    }

    function renderDebateColumn(items, targetEl) {
        if (!targetEl) return;
        if (!items.length) {
            targetEl.innerHTML = '<li class="debate-item">Aucun avis pour le moment.</li>';
            return;
        }
        const html = items.map((item) => {
            const text = String(item.text || item.transcription || "").trim();
            const body = text ? '<p class="debate-item-text">' + esc(text) + "</p>" : "";
            const audio = item.audio ? customAudioPlayerHtml(item.audio, { extraClass: "debate-audio", metaLabel: "Avis vocal" }) : "";
            return (
                '<li class="debate-item">' +
                '<div class="debate-item-head"><strong>' + esc(item.author_label || "Citoyen connecté") + "</strong>" +
                '<span>' + esc(new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })) + "</span></div>" +
                body +
                audio +
                "</li>"
            );
        });
        targetEl.innerHTML = html.join("");
    }

    function renderDebateScore(legalCount, changeCount) {
        const legal = Number(legalCount || 0);
        const change = Number(changeCount || 0);
        const total = legal + change;
        const legalPct = total > 0 ? Math.round((legal / total) * 100) : 0;
        const changePct = total > 0 ? Math.round((change / total) * 100) : 0;
        const legalWidth = total > 0 ? legalPct : 50;
        const changeWidth = total > 0 ? changePct : 50;
        if (el.debateLegalCount) el.debateLegalCount.textContent = legal + " • " + legalPct + "%";
        if (el.debateChangeCount) el.debateChangeCount.textContent = change + " • " + changePct + "%";
        if (el.debateBalanceLegal) el.debateBalanceLegal.style.width = legalWidth + "%";
        if (el.debateBalanceChange) el.debateBalanceChange.style.width = changeWidth + "%";
    }

    async function loadDebateOpinions(signalementId) {
        if (!signalementId) return;
        if (el.debateLegalList) el.debateLegalList.innerHTML = '<li class="debate-item">Chargement...</li>';
        if (el.debateChangeList) el.debateChangeList.innerHTML = '<li class="debate-item">Chargement...</li>';
        renderDebateScore(0, 0);
        try {
            const res = await fetch("/api/signalements/" + Number(signalementId) + "/debats/", {
                credentials: "same-origin",
            });
            if (!res.ok) throw new Error("debats");
            const rows = await res.json();
            const legal = rows.filter((x) => x.opinion_side === "LEGAL");
            const change = rows.filter((x) => x.opinion_side === "CHANGE");
            renderDebateColumn(legal, el.debateLegalList);
            renderDebateColumn(change, el.debateChangeList);
            renderDebateScore(legal.length, change.length);
        } catch (_e) {
            if (el.debateLegalList) el.debateLegalList.innerHTML = '<li class="debate-item">Débat indisponible.</li>';
            if (el.debateChangeList) el.debateChangeList.innerHTML = '<li class="debate-item">Débat indisponible.</li>';
            renderDebateScore(0, 0);
        }
    }

    function openDebateModal(signalementId) {
        const entry = findEntry(signalementId);
        if (!entry || !isDebateCategory(entry.data.category)) {
            showToast("Débat disponible uniquement pour Constitution/Politique.");
            return;
        }
        S.debateSignalementId = Number(signalementId);
        resetDebateComposer();
        if (el.debateTitle) {
            el.debateTitle.textContent = "Débat Public • " + (entry.data.title || "Signalement");
        }

        const connected = isGoogleConnected();
        if (el.debateAuthHint) el.debateAuthHint.style.display = connected ? "none" : "block";
        if (el.debateForm) el.debateForm.style.display = connected ? "block" : "none";

        if (el.debateModal) {
            el.debateModal.classList.add("open");
        }
        loadDebateOpinions(signalementId);
    }

    function closeDebateModal() {
        if (el.debateModal) el.debateModal.classList.remove("open");
        stopDebateRecording();
    }

    async function submitDebateOpinion(evt) {
        evt.preventDefault();
        if (!S.debateSignalementId) return;
        if (!isGoogleConnected()) {
            showToast("Connexion Google requise pour publier.");
            return;
        }

        const fd = new FormData();
        fd.set("unique_device_id", getDeviceId());
        fd.set("pseudonym", String(el.debatePseudonym && el.debatePseudonym.value || "").trim());
        fd.set("opinion_side", String(el.debateSideInput && el.debateSideInput.value || "LEGAL"));
        fd.set("text", String(el.debateText && el.debateText.value || "").trim());
        if (S.debateAudioBlob) {
            fd.set("audio", new File([S.debateAudioBlob], "avis-vocal.webm", { type: S.debateAudioBlob.type || "audio/webm" }));
        }

        if (!String(fd.get("text") || "").trim() && !S.debateAudioBlob) {
            showToast("Ajoute un texte ou un avis vocal.");
            return;
        }

        if (el.debateSubmitBtn) {
            el.debateSubmitBtn.disabled = true;
            el.debateSubmitBtn.textContent = "Publication...";
        }
        try {
            const res = await fetch("/api/signalements/" + S.debateSignalementId + "/debats/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
                body: fd,
            });
            if (!res.ok) {
                if (res.status === 401) {
                    showToast("Connexion Google requise.");
                    return;
                }
                if (res.status === 409) {
                    showToast("Un seul avis par signalement pour cet appareil.");
                    return;
                }
                throw new Error("debate-post");
            }
            showToast("Parole enregistrée.");
            resetDebateComposer();
            loadDebateOpinions(S.debateSignalementId);
        } catch (_e) {
            showToast("Publication impossible.");
        } finally {
            if (el.debateSubmitBtn) {
                el.debateSubmitBtn.disabled = false;
                el.debateSubmitBtn.textContent = "Publier l'avis";
            }
        }
    }

    function startSubmitFeedback() {
        el.submitBtn.disabled = true;
        el.submitBtn.classList.remove("success");
        el.submitBtn.classList.add("loading");
        el.submitProgress.classList.add("show");
        S.submitProgressValue = 0;
        el.submitProgressFill.style.width = "0%";
        if (S.submitProgressTimer) window.clearInterval(S.submitProgressTimer);
        S.submitProgressTimer = window.setInterval(() => {
            S.submitProgressValue = Math.min(S.submitProgressValue + 12, 88);
            el.submitProgressFill.style.width = S.submitProgressValue + "%";
        }, 180);
    }

    function launchConfetti(anchor) {
        if (!el.confettiLayer || !anchor) return;
        const r = anchor.getBoundingClientRect();
        const ox = r.left + r.width / 2;
        const oy = r.top + r.height / 2;
        const colors = ["#5ed8ff", "#7cf2ff", "#ffd166", "#7cff8f", "#ff7ca8"];
        for (let i = 0; i < 18; i += 1) {
            const p = document.createElement("span");
            p.className = "confetti-piece";
            p.style.left = ox + "px";
            p.style.top = oy + "px";
            p.style.background = colors[i % colors.length];
            p.style.setProperty("--dx", (Math.random() * 180 - 90).toFixed(1) + "px");
            p.style.setProperty("--dy", (-40 - Math.random() * 180).toFixed(1) + "px");
            p.style.setProperty("--rot", (Math.random() * 520 - 260).toFixed(0) + "deg");
            el.confettiLayer.appendChild(p);
            window.setTimeout(() => p.remove(), 950);
        }
    }

    function launchKnowledgeParticles(anchor) {
        if (!el.confettiLayer || !anchor) return;
        const r = anchor.getBoundingClientRect();
        const ox = r.left + r.width / 2;
        const oy = r.top + r.height / 2;
        const palette = ["#bb86fc", "#9c27b0", "#03dac6", "#00e5ff"];
        for (let i = 0; i < 10; i += 1) {
            const p = document.createElement("span");
            p.className = "knowledge-particle";
            p.style.left = ox + "px";
            p.style.top = oy + "px";
            p.style.background = palette[i % palette.length];
            p.style.setProperty("--dx", (Math.random() * 70 - 35).toFixed(1) + "px");
            p.style.setProperty("--dy", (-18 - Math.random() * 48).toFixed(1) + "px");
            el.confettiLayer.appendChild(p);
            window.setTimeout(() => p.remove(), 700);
        }
    }

    function markSubmitSuccess() {
        if (S.submitProgressTimer) {
            window.clearInterval(S.submitProgressTimer);
            S.submitProgressTimer = null;
        }
        el.submitProgressFill.style.width = "100%";
        el.submitBtn.classList.remove("loading");
        el.submitBtn.classList.add("success");
        el.submitBtn.disabled = true;
        if (el.reportSuccessFlash) el.reportSuccessFlash.classList.add("show");
        launchConfetti(el.submitBtn);
    }

    function resetSubmitFeedback() {
        if (S.submitProgressTimer) {
            window.clearInterval(S.submitProgressTimer);
            S.submitProgressTimer = null;
        }
        el.submitProgress.classList.remove("show");
        el.submitProgressFill.style.width = "0%";
        el.submitBtn.classList.remove("loading", "success");
        el.submitBtn.disabled = false;
        if (el.reportSuccessFlash) el.reportSuccessFlash.classList.remove("show");
    }

    function notifyLocal(message) {
        if (!("Notification" in window)) return;
        const emit = () => {
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistration().then((reg) => {
                    if (reg) reg.showNotification("SemaChat", { body: message, icon: "/static/icons/icon-192.png", badge: "/static/icons/icon-192.png" });
                });
            }
        };
        if (Notification.permission === "granted") emit();
        else if (Notification.permission === "default") Notification.requestPermission().then((p) => p === "granted" && emit());
    }

    function buildSignalementShareUrl(item) {
        const params = new URLSearchParams();
        params.set("focus", String(Number(item.id || 0)));
        params.set("lat", String(item.lat || ""));
        params.set("lng", String(item.lng || ""));
        params.set("z", "16");
        return window.location.origin + "/?" + params.toString();
    }

    function shareSignalementViaWhatsApp(item) {
        const category = getVisual(item.category).label || "Alerte";
        const url = buildSignalementShareUrl(item);
        const text = encodeURIComponent((item.title || "Signalement SemaChat") + " | " + category + " | " + url);
        window.open("https://wa.me/?text=" + text, "_blank");
        showToast("Lien WhatsApp prépare.");
    }

    async function queueCurrentReport() {
        const mediaMode = el.mediaTypeInput.value;
        const queued = {
            id: Date.now(),
            category: el.categoryInput.value,
            title: String(document.getElementById("title-input").value || "").trim(),
            description: String(document.getElementById("description-input").value || "").trim(),
            lat: S.currentCoords ? String(S.currentCoords.lat) : "",
            lng: S.currentCoords ? String(S.currentCoords.lng) : "",
            reporter_hash: getDeviceId(),
            publish_anonymously: Boolean(el.publishAnonymouslyInput && el.publishAnonymouslyInput.checked),
            media_mode: mediaMode,
            created_at: new Date().toISOString(),
            image_data_url: "",
            video_data_url: "",
            audio_data_url: "",
            video_duration_sec: String(el.videoDurationInput.value || "")
        };

        if (mediaMode === "photo" && el.photoInput.files && el.photoInput.files[0]) {
            queued.image_data_url = await fileToDataUrl(el.photoInput.files[0]);
        } else if (mediaMode === "video" && el.videoInput.files && el.videoInput.files[0]) {
            queued.video_data_url = await fileToDataUrl(el.videoInput.files[0]);
        } else if (mediaMode === "audio") {
            if (S.reportAudioBlob && S.reportAudioBlob.size) {
                queued.audio_data_url = await fileToDataUrl(new File([S.reportAudioBlob], "queued-audio.webm", { type: S.reportAudioBlob.type || "audio/webm" }));
            } else if (el.audioInput && el.audioInput.files && el.audioInput.files[0]) {
                queued.audio_data_url = await fileToDataUrl(el.audioInput.files[0]);
            }
        }

        const rows = readQueuedReports();
        rows.push(queued);
        writeQueuedReports(rows);
        return queued;
    }

    async function submitQueuedReport(queued) {
        const fd = new FormData();
        fd.set("category", queued.category || "ENERGIE");
        fd.set("title", queued.title || "");
        fd.set("description", queued.description || "");
        fd.set("lat", queued.lat || "");
        fd.set("lng", queued.lng || "");
        fd.set("reporter_hash", queued.reporter_hash || getDeviceId());
        fd.set("publish_anonymously", queued.publish_anonymously ? "true" : "false");
        if (queued.media_mode === "photo" && queued.image_data_url) {
            const imageFile = dataUrlToFile(queued.image_data_url, "queued-photo.jpg");
            if (imageFile) fd.set("image", imageFile);
        } else if (queued.media_mode === "video" && queued.video_data_url) {
            const videoFile = dataUrlToFile(queued.video_data_url, "queued-video.webm");
            if (videoFile) {
                fd.set("video", videoFile);
                fd.set("video_duration_sec", queued.video_duration_sec || "0");
            }
        } else if (queued.media_mode === "audio" && queued.audio_data_url) {
            const audioFile = dataUrlToFile(queued.audio_data_url, "queued-audio.webm");
            if (audioFile) fd.set("audio", audioFile);
        }
        const res = await fetch("/api/signalements/", {
            method: "POST",
            credentials: "same-origin",
            headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
            body: fd
        });
        if (!res.ok) throw new Error("queued-post");
        return res.json();
    }

    async function flushQueuedReports() {
        if (!navigator.onLine) return;
        const rows = readQueuedReports();
        if (!rows.length) return;
        const keep = [];
        let sentCount = 0;
        for (const queued of rows) {
            try {
                const data = await submitQueuedReport(queued);
                addMarker(data, false);
                S.totalReports += 1;
                S.sessionReports += 1;
                sentCount += 1;
            } catch (_e) {
                keep.push(queued);
            }
        }
        writeQueuedReports(keep);
        if (sentCount) {
            syncProfileStats();
            loadSelfProfile();
            showToast(sentCount === 1 ? "1 message hors-ligne envoye." : (sentCount + " messages hors-ligne envoyes."));
        }
    }

    function consumeSharedFocusFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const focusId = Number(params.get("focus") || 0);
        const chatHash = String(params.get("chat_with") || "").trim();
        const lat = Number(params.get("lat") || 0);
        const lng = Number(params.get("lng") || 0);
        const zoom = Number(params.get("z") || 16);
        if (focusId) S.pendingSharedFocusId = focusId;
        if (focusId && Number.isFinite(lat) && Number.isFinite(lng)) {
            map.setView([lat, lng], zoom, { animate: true });
        }
        if (chatHash) {
            window.setTimeout(async () => {
                try {
                    const profile = await fetchSocialProfile(chatHash, false);
                    openDirectChat(chatHash, profile.display_name || displayNameFromHash(chatHash));
                } catch (_e) {
                    openDirectChat(chatHash, displayNameFromHash(chatHash));
                }
                params.delete("chat_with");
                const next = params.toString();
                window.history.replaceState({}, "", next ? ("?" + next) : "/");
            }, 450);
        }
    }

    function openStatsPanel() {
        const total = Math.max(S.totalReports, 1);
        const resolved = S.markerStore.filter((e) => Number(e.data.validation_count || 0) > 50).length;
        el.statsPanel.classList.add("open");
        el.statsResolvedFill.style.width = Math.round((resolved / total) * 100) + "%";
        el.statsReportedFill.style.width = Math.min(100, Math.round((S.totalReports / total) * 100)) + "%";
        renderLeaderboard();
        loadLeaderboard(10);
    }

    function closeStatsPanel() { el.statsPanel.classList.remove("open"); }

    function syncProfileStats() {
        el.totalReports.textContent = String(S.totalReports);
        el.sessionReports.textContent = String(S.sessionReports);
        if (el.userNavLabel) {
            el.userNavLabel.textContent = "User (" + String(S.totalReports) + ")";
        }
        if (el.knowledgeCount) {
            el.knowledgeCount.textContent = String(S.knowledgeContributionCount);
        }
        const lv = pointsToNextLevel(S.points);
        if (el.knowledgeBadge) {
            el.knowledgeBadge.style.display = lv.level >= 7 ? "inline-flex" : "none";
        }
        if (el.profileLevelBadge) {
            el.profileLevelBadge.textContent = "Level " + lv.level;
        }
        if (el.profileLevelTitle) {
            el.profileLevelTitle.textContent = "Progression vers Level " + (lv.level + 1);
        }
        if (el.profileLevelFill) {
            el.profileLevelFill.style.width = Math.max(0, Math.min(100, Math.round((lv.inLevel / lv.need) * 100))) + "%";
        }
        if (el.profileLevelMeta) {
            el.profileLevelMeta.textContent = lv.inLevel + " / " + lv.need + " points";
        }
        if (el.avatarLevelBadge) {
            el.avatarLevelBadge.textContent = String(lv.level);
        }
        if (el.profileRank) {
            el.profileRank.innerHTML = renderProfileRankBadge(S.profileRank || "Citoyen Novice");
        }
    }

    async function loadLeaderboard(limit) {
        try {
            const query = new URLSearchParams({ limit: String(limit || 20) }).toString();
            const res = await fetch("/api/social/leaderboard/?" + query, { credentials: "same-origin" });
            if (!res.ok) throw new Error("leaderboard");
            const rows = await res.json();
            S.topCitizens = rows.map((row) => ({
                hash: row.device_hash,
                score: Number(row.points || 0),
                name: row.display_name || displayNameFromHash(row.device_hash),
                level: Number(row.level || 1),
                rank: row.rank_title || "Citoyen Novice"
            }));
            S.top10Hashes = {};
            S.topCitizens.slice(0, 10).forEach((x) => { S.top10Hashes[x.hash] = true; });
            renderLeaderboard();
            renderFeed();
        } catch (_e) {}
    }

    function renderLeaderboard() {
        if (!el.topCitizensList) return;
        if (!S.topCitizens.length) {
            el.topCitizensList.innerHTML = '<li class="leaderboard-item">Classement en cours de calcul...</li>';
            return;
        }
        const self = getDeviceId();
        const selfPhoto = localStorage.getItem("kolona_profile_photo");
        const html = S.topCitizens.slice(0, 10).map((user, idx) => (
            '<li class="leaderboard-item">' +
            '<div class="leaderboard-left">' +
            '<img class="leaderboard-avatar" src="' + esc(user.hash === self && selfPhoto ? selfPhoto : avatarDataUrl(user.hash)) + '" alt="Avatar citoyen">' +
            '<span class="leaderboard-name">#' + (idx + 1) + " " + esc(user.name || displayNameFromHash(user.hash)) + " • Lv." + Number(user.level || 1) + "</span>" +
            "</div>" +
            '<span class="leaderboard-score">' + user.score + " pts</span>" +
            "</li>"
        ));
        el.topCitizensList.innerHTML = html.join("");
    }

    function formatTags(value) {
        return String(value || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 4)
            .map((x) => "#" + x)
            .join(" ");
    }

    function isPdfAttachment(path) {
        return /\.pdf(?:$|\?)/i.test(String(path || ""));
    }

    function renderKnowledgePdfPreview(item) {
        const title = esc(item.title || "Document universitaire");
        const excerpt = esc(truncateText(item.content || "Ressource partagée par la communauté universitaire.", 84).short || "");
        return (
            '<div class="knowledge-preview-pdf">' +
            '<div class="knowledge-preview-top"><strong>' + title + '</strong><span class="knowledge-preview-badge">PDF</span></div>' +
            '<div style="font-size:11px;color:#506172;margin-bottom:10px;">Première page • aperçu catalogue</div>' +
            '<div style="font-size:12px;color:#2b3a4f;line-height:1.4;margin-bottom:10px;">' + excerpt + "</div>" +
            '<div class="knowledge-preview-lines">' +
            '<span class="knowledge-preview-line"></span>' +
            '<span class="knowledge-preview-line"></span>' +
            '<span class="knowledge-preview-line short"></span>' +
            '<span class="knowledge-preview-line"></span>' +
            '<span class="knowledge-preview-line short"></span>' +
            "</div>" +
            "</div>"
        );
    }

    function knowledgeResourceUrl(item) {
        if (!item) return window.location.origin;
        return window.location.origin + "/?knowledge=" + Number(item.id || 0);
    }

    function openKnowledgeQr(item) {
        if (!item || !el.knowledgeQrModal || !el.knowledgeQrStage) return;
        S.activeKnowledgeQr = item;
        el.knowledgeQrStage.innerHTML = "";
        if (el.knowledgeQrSubtitle) {
            el.knowledgeQrSubtitle.textContent = item.title || "Accès rapide à la ressource.";
        }
        if (window.QRCode) {
            new window.QRCode(el.knowledgeQrStage, {
                text: knowledgeResourceUrl(item),
                width: 160,
                height: 160,
                colorDark: "#0b1c2d",
                colorLight: "#ffffff",
                correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 0
            });
        } else {
            el.knowledgeQrStage.innerHTML = '<div class="knowledge-meta">QR indisponible hors ligne.</div>';
        }
        el.knowledgeQrModal.classList.add("open");
    }

    function closeKnowledgeQr() {
        if (!el.knowledgeQrModal || !el.knowledgeQrStage) return;
        el.knowledgeQrModal.classList.remove("open");
        el.knowledgeQrStage.innerHTML = "";
        S.activeKnowledgeQr = null;
    }

    async function generateKnowledgeFlyer() {
        if (!S.activeKnowledgeQr) return;
        const qrCanvas = el.knowledgeQrStage ? el.knowledgeQrStage.querySelector("canvas") : null;
        if (!qrCanvas) {
            showToast("QR indisponible pour le flyer.");
            return;
        }
        const item = S.activeKnowledgeQr;
        const c = document.createElement("canvas");
        c.width = 1080;
        c.height = 1350;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#07111a";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#0f2238";
        ctx.fillRect(48, 48, c.width - 96, c.height - 96);
        ctx.fillStyle = "#f4fbff";
        ctx.font = "700 54px Georgia";
        wrapCanvasText(ctx, item.title || "Ressource académique", 96, 180, c.width - 192, 70);
        ctx.fillStyle = "#a8d3f4";
        ctx.font = "28px Segoe UI";
        ctx.fillText("SemaChat • Hub Savoir", 96, 110);
        ctx.fillText((item.institution || "Université") + " • " + (item.category || "Ressource"), 96, 320);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(320, 430, 440, 440);
        ctx.drawImage(qrCanvas, 360, 470, 360, 360);
        ctx.fillStyle = "#d6ecff";
        ctx.font = "600 28px Segoe UI";
        ctx.fillText("Scannez pour accéder à la ressource", 278, 940);
        ctx.fillStyle = "#8fdfff";
        ctx.font = "26px Segoe UI";
        ctx.fillText("Source Académique", 96, 1040);
        ctx.fillStyle = "#f4fbff";
        ctx.font = "24px Segoe UI";
        wrapCanvasText(ctx, item.resource_link || knowledgeResourceUrl(item), 96, 1086, c.width - 192, 34);
        const blob = await new Promise((resolve) => c.toBlob(resolve, "image/png"));
        if (!blob) return;
        const file = new File([blob], "semachat-flyer-" + Number(item.id || Date.now()) + ".png", { type: "image/png" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(a.href), 1200);
        showToast("Flyer généré.");
    }

    function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = String(text || "").split(/\s+/);
        let line = "";
        let yy = y;
        words.forEach((word) => {
            const test = line ? (line + " " + word) : word;
            if (ctx.measureText(test).width > maxWidth && line) {
                ctx.fillText(line, x, yy);
                yy += lineHeight;
                line = word;
            } else {
                line = test;
            }
        });
        if (line) ctx.fillText(line, x, yy);
    }

    async function citeKnowledgeResource(resourceId, source) {
        try {
            const res = await fetch("/api/ressources/" + Number(resourceId) + "/cite/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({ unique_device_id: getDeviceId(), source: source })
            });
            if (!res.ok) throw new Error("citation");
            const payload = await res.json();
            [S.knowledgeItems, S.knowledgeLibraryAll, S.feedItems].forEach((bucket) => {
                if (!Array.isArray(bucket)) return;
                bucket.forEach((item) => {
                    if ((item.type === "knowledge" || item.type === undefined) && Number(item.id || 0) === Number(resourceId)) {
                        item.citation_count = Number(payload.citation_count || item.citation_count || 0);
                    }
                });
            });
            renderKnowledgeList();
        } catch (_e) {}
    }

    async function mentionKnowledgeResource(resourceId, grade) {
        try {
            const res = await fetch("/api/ressources/" + Number(resourceId) + "/mention/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({ unique_device_id: getDeviceId(), grade: grade })
            });
            if (!res.ok) throw new Error("mention");
            const payload = await res.json();
            [S.knowledgeItems, S.knowledgeLibraryAll].forEach((bucket) => {
                if (!Array.isArray(bucket)) return;
                bucket.forEach((item) => {
                    if (Number(item.id || 0) === Number(resourceId)) {
                        item.my_mention = payload.grade || "";
                        item.mention_counts = payload.mention_counts || item.mention_counts || {};
                    }
                });
            });
            renderKnowledgeList();
            showToast("Mention enregistrée.");
        } catch (_e) {
            showToast("Mention impossible.");
        }
    }

    async function shareKnowledgeToWhatsApp(resourceId) {
        const item = S.knowledgeLibraryAll.find((row) => Number(row.id || 0) === Number(resourceId))
            || S.knowledgeItems.find((row) => Number(row.id || 0) === Number(resourceId));
        if (!item) return;
        const text = [
            item.title || "Ressource académique",
            item.institution || "Université",
            knowledgeResourceUrl(item)
        ].join(" • ");
        await citeKnowledgeResource(resourceId, "SHARE");
        window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
    }

    function getKnowledgeFilteredItems() {
        const q = String(S.knowledgeSearchQuery || "").trim().toLowerCase();
        if (!q) return S.knowledgeItems.slice();
        return S.knowledgeItems.filter((item) => {
            const haystack = [
                item.title,
                item.content,
                item.tags,
                item.author_label,
                item.institution,
                item.category
            ].join(" ").toLowerCase();
            return haystack.includes(q);
        });
    }

    function renderKnowledgeSuggestions() {
        if (!el.knowledgeSearchSuggestions) return;
        const q = String(S.knowledgeSearchQuery || "").trim().toLowerCase();
        if (q.length < 2) {
            el.knowledgeSearchSuggestions.innerHTML = "";
            el.knowledgeSearchSuggestions.classList.remove("show");
            return;
        }
        const seen = {};
        const matches = S.knowledgeLibraryAll.filter((item) => {
            const title = String(item.title || "").toLowerCase();
            const content = String(item.content || "").toLowerCase();
            return title.includes(q) || content.includes(q);
        }).filter((item) => {
            const key = String(item.title || "").toLowerCase();
            if (!key || seen[key]) return false;
            seen[key] = true;
            return true;
        }).slice(0, 5);
        if (!matches.length) {
            el.knowledgeSearchSuggestions.innerHTML = "";
            el.knowledgeSearchSuggestions.classList.remove("show");
            return;
        }
        el.knowledgeSearchSuggestions.innerHTML = matches.map((item) => (
            '<li><button type="button" class="knowledge-suggestion-btn" data-knowledge-suggestion="' + Number(item.id || 0) + '">' +
            '<strong>' + esc(item.title || "Ressource") + '</strong>' +
            '<span>' + esc(item.institution || "Université") + " • " + esc(item.category || "Cours") + "</span>" +
            "</button></li>"
        )).join("");
        el.knowledgeSearchSuggestions.classList.add("show");
    }

    function renderKnowledgeList() {
        if (!el.knowledgeList) return;
        const items = getKnowledgeFilteredItems();
        if (!items.length) {
            el.knowledgeList.innerHTML = '<li class="knowledge-item">Aucune ressource pour ce filtre.</li>';
            return;
        }
        const html = items.map((item) => {
            const file = item.attachment
                ? '<a class="knowledge-file" href="' + esc(item.attachment) + '" target="_blank" rel="noopener" data-knowledge-open-file="' + Number(item.id || 0) + '">Ouvrir fichier</a>'
                : "";
            const link = item.resource_link
                ? '<a class="knowledge-file" href="' + esc(item.resource_link) + '" target="_blank" rel="noopener" data-knowledge-open-link="' + Number(item.id || 0) + '">Ouvrir source</a>'
                : "";
            const thanks = Number(item.thanks_count || 0);
            const citations = Number(item.citation_count || 0);
            const tags = formatTags(item.tags);
            const certified = item.author_is_certified
                ? '<span class="knowledge-certified-badge">★ Auteur certifié</span>'
                : "";
            const preview = item.attachment && isPdfAttachment(item.attachment)
                ? renderKnowledgePdfPreview(item)
                : "";
            const mentionCounts = item.mention_counts || {};
            const myMention = String(item.my_mention || "");
            return (
                '<li class="knowledge-item">' +
                '<div class="knowledge-item-head">' +
                '<strong class="knowledge-title-text">' + esc(item.title) + "</strong>" +
                '<span class="knowledge-chip">' + esc(item.category) + "</span>" +
                "</div>" +
                '<div class="knowledge-author-row"><span class="knowledge-meta">' + esc(item.author_label || "SemaÉtudiant") + '</span>' + certified + "</div>" +
                '<p class="knowledge-meta">' + esc(item.institution) + " • " + new Date(item.created_at).toLocaleDateString() + "</p>" +
                '<p class="knowledge-meta"><strong>Abstract:</strong> ' + esc(item.content || "Ressource partagée") + "</p>" +
                (tags ? '<p class="knowledge-meta">' + esc(tags) + "</p>" : "") +
                '<p class="knowledge-meta">#' + esc(item.institution) + "</p>" +
                '<p class="knowledge-meta knowledge-citation-meta">Cité par ' + citations + " pairs</p>" +
                preview +
                file +
                link +
                '<div class="knowledge-actions">' +
                '<div class="knowledge-action-cluster">' +
                '<button class="merci-btn" data-id="' + Number(item.id || 0) + '">Merci (' + thanks + ")</button>" +
                '<button class="knowledge-secondary-btn" data-knowledge-share="' + Number(item.id || 0) + '">WhatsApp</button>' +
                '<button class="knowledge-secondary-btn" data-knowledge-qr="' + Number(item.id || 0) + '">QR Code</button>' +
                '<button class="knowledge-secondary-btn" data-knowledge-flyer="' + Number(item.id || 0) + '">Générer Flyer</button>' +
                "</div>" +
                '<div class="knowledge-mention-row">' +
                '<button class="knowledge-mention-btn' + (myMention === "PASSABLE" ? " active" : "") + '" data-knowledge-mention="PASSABLE" data-id="' + Number(item.id || 0) + '">Passable (' + Number(mentionCounts.PASSABLE || 0) + ")</button>" +
                '<button class="knowledge-mention-btn' + (myMention === "BIEN" ? " active" : "") + '" data-knowledge-mention="BIEN" data-id="' + Number(item.id || 0) + '">Bien (' + Number(mentionCounts.BIEN || 0) + ")</button>" +
                '<button class="knowledge-mention-btn' + (myMention === "TRES_BIEN" ? " active" : "") + '" data-knowledge-mention="TRES_BIEN" data-id="' + Number(item.id || 0) + '">Mention Très Bien (' + Number(mentionCounts.TRES_BIEN || 0) + ")</button>" +
                "</div>" +
                "</div>" +
                "</li>"
            );
        });
        el.knowledgeList.innerHTML = html.join("");
    }

    function reactionPanelById(id) {
        return document.querySelector('.reaction-panel[data-id="' + Number(id) + '"]');
    }

    function renderReactionList(listEl, rows) {
        if (!listEl) return;
        if (!rows || !rows.length) {
            listEl.innerHTML = '<li class="reaction-item"><p class="reaction-text">Aucun commentaire audio pour le moment.</p></li>';
            return;
        }
        const html = rows.map((row) => {
            const time = new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const audio = row.format === "AUDIO" && row.audio
                ? customAudioPlayerHtml(row.audio, { extraClass: "reaction-audio-player", metaLabel: "Commentaire audio" })
                : "";
            const text = row.format === "TEXT"
                ? '<p class="reaction-text">' + esc(row.text || "") + "</p>"
                : "";
            const del = row.is_mine
                ? '<button class="reaction-delete-btn" data-reaction-id="' + Number(row.id || 0) + '" title="Supprimer ma réaction" aria-label="Supprimer ma réaction">🗑</button>'
                : "";
            return (
                '<li class="reaction-item">' +
                '<div class="reaction-item-head"><strong class="reaction-author">' + esc(row.author_label || "SemaCitoyen") + '</strong><span class="reaction-meta">' + esc(time) + "</span></div>" +
                text +
                audio +
                del +
                "</li>"
            );
        });
        listEl.innerHTML = html.join("");
    }

    function renderReactionPreview(rows) {
        if (!rows || !rows.length) return "";
        const html = rows.slice(0, 2).map((row) => {
            const icon = row.format === "AUDIO" ? "🎙️" : "⌨️";
            const audio = row.format === "AUDIO" && row.audio
                ? customAudioPlayerHtml(row.audio, { extraClass: "reaction-preview-audio", metaLabel: "Audio court" })
                : "";
            const text = row.format === "TEXT"
                ? '<span class="reaction-preview-text">' + esc(truncateText(row.text || "", 46).short || "Message") + "</span>"
                : '<span class="reaction-preview-text">' + esc((row.author_label || "SemaCitoyen") + " a repondu") + "</span>";
            return (
                '<li class="reaction-preview-item">' +
                '<span class="reaction-preview-icon">' + icon + "</span>" +
                text +
                audio +
                "</li>"
            );
        });
        return '<ul class="reaction-preview-list">' + html.join("") + "</ul>";
    }

    function setReactionPreview(signalementId, rows) {
        const panel = reactionPanelById(signalementId);
        if (!panel) return;
        const host = panel.previousElementSibling;
        const html = renderReactionPreview(rows || []);
        if (host && host.classList && host.classList.contains("reaction-preview-list")) {
            if (html) {
                host.outerHTML = html;
            } else {
                host.remove();
            }
            return;
        }
        if (html) {
            panel.insertAdjacentHTML("beforebegin", html);
        }
    }

    function setReactionCountLabel(signalementId, count) {
        const label = document.querySelector('.reaction-count[data-id="' + Number(signalementId) + '"]');
        if (!label) return;
        const n = Number(count || 0);
        label.textContent = n + " réaction" + (n > 1 ? "s" : "");
    }

    async function loadReactions(signalementId, panel) {
        if (!panel) return;
        const listEl = panel.querySelector(".reaction-list");
        if (listEl) listEl.innerHTML = '<li class="reaction-item"><p class="reaction-text">Chargement...</p></li>';
        try {
            const params = new URLSearchParams({ unique_device_id: getDeviceId() });
            const res = await fetch("/api/signalements/" + Number(signalementId) + "/reactions/?" + params.toString(), {
                credentials: "same-origin",
            });
            if (!res.ok) throw new Error("reactions-load");
            const rows = await res.json();
            const feedItem = S.feedItems.find((item) => item.type === "alert" && Number(item.id || 0) === Number(signalementId));
            if (feedItem) {
                feedItem.reaction_count = rows.length;
                feedItem.recent_reactions = rows.slice(0, 2);
            }
            renderReactionList(listEl, rows);
            setReactionCountLabel(signalementId, rows.length);
            setReactionPreview(signalementId, rows.slice(0, 2));
        } catch (_e) {
            if (listEl) {
                listEl.innerHTML = '<li class="reaction-item"><p class="reaction-text">Réactions indisponibles.</p></li>';
            }
        }
    }

    function switchReactionMode(panel, mode) {
        if (!panel) return;
        panel.querySelectorAll(".reaction-mode-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
        });
        const voiceWrap = panel.querySelector(".reaction-voice-wrap");
        if (voiceWrap) voiceWrap.style.opacity = mode === "voice" ? "1" : "0.82";
    }

    async function toggleReactionPanel(signalementId) {
        const panel = reactionPanelById(signalementId);
        if (!panel) return;
        const isOpen = panel.classList.contains("open");
        document.querySelectorAll(".reaction-panel.open").forEach((p) => {
            if (p !== panel) p.classList.remove("open");
        });
        panel.classList.toggle("open", !isOpen);
        if (!isOpen) {
            S.feedReactionBlob = null;
            S.feedReactionTargetId = Number(signalementId);
            resetFeedReactionPreview(panel);
            await loadReactions(signalementId, panel);
        } else {
            closeFeedReactionRecorder();
        }
    }

    function resetFeedReactionPreview(panel, keepStatus) {
        if (!panel) return;
        const preview = panel.querySelector(".reaction-audio-preview");
        const status = panel.querySelector(".reaction-voice-status");
        const timer = panel.querySelector(".reaction-voice-timer");
        const dot = panel.querySelector(".reaction-voice-dot");
        const resetBtn = panel.querySelector(".reaction-reset-btn");
        if (preview) {
            preview.pause();
            preview.removeAttribute("src");
            preview.load();
            preview.style.display = "none";
        }
        if (status && !keepStatus) status.textContent = "Pret a enregistrer";
        if (timer) timer.textContent = "00:00";
        if (dot) dot.classList.remove("recording");
        if (resetBtn) resetBtn.classList.remove("show");
        S.feedReactionBlob = null;
    }

    async function sendTextReaction(signalementId, panel) {
        const txt = panel ? panel.querySelector(".reaction-textarea") : null;
        if (!txt) return;
        const value = String(txt.value || "").trim();
        if (!value) {
            showToast("Écris un message avant d'envoyer.");
            return;
        }
        const fd = new FormData();
        fd.set("unique_device_id", getDeviceId());
        fd.set("format", "TEXT");
        fd.set("text", value);
        try {
            const res = await fetch("/api/signalements/" + Number(signalementId) + "/reactions/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
                body: fd,
            });
            if (!res.ok) throw new Error("reaction-post");
            txt.value = "";
            await loadReactions(signalementId, panel);
            showToast("Réaction envoyée.");
        } catch (_e) {
            showToast("Envoi de réaction impossible.");
        }
    }

    async function startFeedVoiceReaction(signalementId, panel) {
        if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("Micro non supporté sur ce navigateur.");
            return;
        }
        try {
            closeFeedReactionRecorder();
            S.feedReactionSeconds = 0;
            S.feedReactionBlob = null;
            S.feedReactionTargetId = Number(signalementId);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            S.feedReactionStream = stream;
            const chunks = [];
            const recorder = new MediaRecorder(stream);
            S.feedReactionRecorder = recorder;

            const dot = panel ? panel.querySelector(".reaction-voice-dot") : null;
            const timer = panel ? panel.querySelector(".reaction-voice-timer") : null;
            const status = panel ? panel.querySelector(".reaction-voice-status") : null;
            const preview = panel ? panel.querySelector(".reaction-audio-preview") : null;
            const resetBtn = panel ? panel.querySelector(".reaction-reset-btn") : null;
            if (dot) dot.classList.add("recording");
            if (status) status.textContent = "Enregistrement...";
            if (timer) timer.textContent = "00:00";
            if (preview) {
                preview.pause();
                preview.removeAttribute("src");
                preview.load();
                preview.style.display = "none";
            }
            if (resetBtn) resetBtn.classList.remove("show");

            S.feedReactionTimer = window.setInterval(() => {
                S.feedReactionSeconds += 1;
                if (timer) timer.textContent = formatTimer(S.feedReactionSeconds);
                if (S.feedReactionSeconds >= 30) {
                    showToast("Audio max 30s atteint.");
                    closeFeedReactionRecorder();
                }
            }, 1000);

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = () => {
                if (S.feedReactionTimer) {
                    window.clearInterval(S.feedReactionTimer);
                    S.feedReactionTimer = null;
                }
                if (dot) dot.classList.remove("recording");
                if (status) status.textContent = "Audio prêt";
                const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
                S.feedReactionBlob = blob.size ? blob : null;
                if (preview && S.feedReactionBlob) {
                    preview.src = URL.createObjectURL(S.feedReactionBlob);
                    preview.style.display = "block";
                }
                if (resetBtn && S.feedReactionBlob) resetBtn.classList.add("show");
                if (S.feedReactionStream) {
                    S.feedReactionStream.getTracks().forEach((t) => t.stop());
                    S.feedReactionStream = null;
                }
            };
            recorder.start();
        } catch (_e) {
            showToast("Autorise le micro pour réagir en audio.");
        }
    }

    async function sendVoiceReaction(signalementId, panel) {
        if (!S.feedReactionBlob || !S.feedReactionBlob.size) {
            showToast("Enregistre un message audio d'abord.");
            return;
        }
        const fd = new FormData();
        fd.set("unique_device_id", getDeviceId());
        fd.set("format", "AUDIO");
        let blobToSend = S.feedReactionBlob;
        if (S.dataSaverEnabled) {
            try {
                const compressed = await compressAudioForMobile(blobToSend);
                blobToSend = compressed.blob || blobToSend;
            } catch (_e) {}
        }
        const file = new File(
            [blobToSend],
            "reaction-" + Date.now() + ".webm",
            { type: blobToSend.type || "audio/webm" }
        );
        fd.set("audio", file);
        try {
            const res = await fetch("/api/signalements/" + Number(signalementId) + "/reactions/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
                body: fd,
            });
            if (!res.ok) throw new Error("reaction-audio-post");
            resetFeedReactionPreview(panel);
            await loadReactions(signalementId, panel);
            showToast("Réaction audio envoyée.");
        } catch (_e) {
            showToast("Envoi audio impossible.");
        }
    }

    async function deleteReaction(signalementId, reactionId, panel) {
        if (!signalementId || !reactionId || !panel) return;
        try {
            const params = new URLSearchParams({ unique_device_id: getDeviceId() });
            const res = await fetch(
                "/api/signalements/" + Number(signalementId) + "/reactions/" + Number(reactionId) + "/?" + params.toString(),
                {
                    method: "DELETE",
                    credentials: "same-origin",
                    headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
                }
            );
            if (!res.ok) throw new Error("reaction-delete");
            await loadReactions(signalementId, panel);
            showToast("Réaction supprimée.");
        } catch (_e) {
            showToast("Suppression impossible.");
        }
    }

    async function loadKnowledgeResources() {
        const params = new URLSearchParams();
        if (el.knowledgeInstitutionFilter && el.knowledgeInstitutionFilter.value !== "ALL") {
            params.set("institution", el.knowledgeInstitutionFilter.value);
        }
        if (el.knowledgeCategoryFilter && el.knowledgeCategoryFilter.value !== "ALL") {
            params.set("category", el.knowledgeCategoryFilter.value);
        }
        try {
            const query = params.toString();
            const [res, allRes] = await Promise.all([
                fetch("/api/ressources/" + (query ? "?" + query : "")),
                fetch("/api/ressources/")
            ]);
            if (!res.ok || !allRes.ok) throw new Error("knowledge-load");
            S.knowledgeItems = await res.json();
            S.knowledgeLibraryAll = await allRes.json();
            await loadLeaderboard(20);
            renderKnowledgeList();
            renderKnowledgeSuggestions();
            notifyAlliedImportantResources(S.knowledgeItems);
        } catch (_e) {
            if (el.knowledgeList) {
                el.knowledgeList.innerHTML = '<li class="knowledge-item">Chargement impossible pour le moment.</li>';
            }
        }
    }

    function interleaveFeed(alerts, knowledges) {
        const out = [];
        let i = 0;
        while (i < alerts.length || i < knowledges.length) {
            if (i < alerts.length) out.push(alerts[i]);
            if (i < knowledges.length) out.push(knowledges[i]);
            i += 1;
        }
        return out;
    }

    function renderFeed() {
        if (!el.feedList) return;
        if (!S.feedItems.length) {
            el.feedList.innerHTML = '<li class="feed-item">Aucune actualité locale pour le moment.</li>';
            return;
        }

        const html = S.feedItems.map((item) => {
            const live = item.live ? '<span class="live-pill">LIVE</span>' : "";
            const relativeTime = formatRelativeTime(item.created_at);
            const actionLabel = item.type === "alert" ? "Je confirme" : "Utile";
            const distance = Number.isFinite(item.distance_m)
                ? " • " + Math.round(item.distance_m) + "m"
                : "";
            const key = item.type + "-" + Number(item.id || 0);
            const desc = truncateText(item.description, 100);
            const authorHash = String(item.author_hash || "");
            const authorProfileId = Number(item.author_profile_id || 0);
            const author = displayAuthorLabel(item);
            const voteFeedbackActive = Boolean(S.voteFeedbackIds[String(item.id || 0)]);
            const supportCount = Number(item.support_count || 0);
            const compassionCount = Number(item.compassion_count || 0);
            const myMood = String(item.my_mood || "");
            const topRankClass = S.top10Hashes[authorHash] ? " top-rank" : "";
            const profileHref = (!item.publish_anonymously && authorProfileId) ? ("/profile/" + authorProfileId + "/") : "#";
            const debateAction = item.type === "alert" && isDebateCategory(item.category)
                ? '<button class="feed-action-btn debate-btn" data-id="' + Number(item.id || 0) + '">Prendre la parole</button>'
                : "";
            const reactButton = item.type === "alert"
                ? (
                    '<button class="feed-action-btn reaction-toggle-btn" data-id="' + Number(item.id || 0) + '"><span class="icon-label">' + iconSvg("mic") + '<span>Réagir</span></span></button>' +
                    '<span class="reaction-count" data-id="' + Number(item.id || 0) + '">' +
                    Number(item.reaction_count || 0) + " réaction" + (Number(item.reaction_count || 0) > 1 ? "s" : "") +
                    "</span>"
                )
                : "";
            const moodButtons = item.type === "alert"
                ? (
                    '<button class="feed-action-btn mood-chip' + (myMood === "SUPPORT" ? " active" : "") + '" data-mood="SUPPORT" data-id="' + Number(item.id || 0) + '">\uD83D\uDC4D ' + supportCount + "</button>" +
                    '<button class="feed-action-btn mood-chip sad' + (myMood === "SAD" ? " active" : "") + '" data-mood="SAD" data-id="' + Number(item.id || 0) + '">\uD83D\uDE22 ' + compassionCount + "</button>"
                )
                : "";
            const reactionPanel = item.type === "alert"
                ? (
                    '<div class="reaction-panel" data-id="' + Number(item.id || 0) + '">' +
                    '<div class="reaction-banner">Le peuple Sema ici...</div>' +
                    '<div class="reaction-compose-title">Repondre</div>' +
                    '<div class="reaction-composer">' +
                    '<div class="reaction-voice-shortcuts">' +
                    '<button class="reaction-mic-btn reaction-start-voice-btn" data-id="' + Number(item.id || 0) + '" aria-label="Répondre en audio">🎙️</button>' +
                    '<button class="reaction-stop-btn reaction-stop-voice-btn" data-id="' + Number(item.id || 0) + '">⏹ Stop</button>' +
                    "</div>" +
                    "</div>" +
                    '<div class="reaction-voice-wrap">' +
                    '<div class="reaction-voice-head"><span class="reaction-voice-dot"></span><span class="reaction-voice-status">Prêt à enregistrer</span><strong class="reaction-voice-timer">00:00</strong></div>' +
                    '<div class="reaction-voice-actions">' +
                    '<button class="feed-action-btn reaction-send-voice-btn" data-id="' + Number(item.id || 0) + '">Publier audio</button>' +
                    '<button class="reaction-reset-btn" data-id="' + Number(item.id || 0) + '" title="Supprimer et recommencer" aria-label="Supprimer et recommencer">🗑</button>' +
                    "</div>" +
                    '<audio class="reaction-audio-preview" controls></audio>' +
                    '<div class="reaction-comments-title">Commentaires audio</div>' +
                    '<ul class="reaction-list"></ul>' +
                    "</div>" +
                    "</div>"
                )
                : "";
            const reactionPreview = item.type === "alert" ? renderReactionPreview(item.recent_reactions || []) : "";
            const feedExtraClass = item.type === "alert" && item.category === "CONSTITUTION" ? " constitution-glow" : "";
            let media = "";
            if (item.media_type === "video" && item.media_url) {
                media = '<div class="feed-media-wrap"><video class="feed-media feed-media-video" muted playsinline preload="metadata" src="' + esc(item.media_url) + '"></video><span class="media-type-icon">▶</span></div>';
            } else if (item.media_type === "image" && item.media_url) {
                media = '<div class="feed-media-wrap"><img class="feed-media" src="' + esc(item.media_url) + '" alt="Illustration actualité"><span class="media-type-icon">📷</span></div>';
            } else if (item.media_type === "audio" && item.media_url) {
                media = '<div class="feed-media-wrap audio-live">' + customAudioPlayerHtml(item.media_url, { extraClass: "feed-media", metaLabel: "Sema audio" }) + '<span class="media-type-icon">🎵</span></div>';
            }
            return (
                '<li class="feed-item ' + (item.type === "alert" ? "alert" : "savoir") + feedExtraClass + '" data-feed-key="' + esc(key) + '">' +
                '<div class="feed-top">' +
                '<span class="feed-type-badge">' + esc(item.type === "alert" ? "Alerte" : "Savoir") + "</span>" +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                (relativeTime ? ('<span class="relative-time-badge">' + esc(relativeTime) + "</span>") : "") +
                live +
                "</div>" +
                "</div>" +
                '<div class="feed-author">' +
                '<a class="feed-author-link" href="' + esc(profileHref) + '">' +
                '<span class="feed-avatar-btn' + topRankClass + '" data-author-hash="' + esc(authorHash) + '">' + esc(authorInitials(item)) + "</span>" +
                "</a>" +
                '<a class="feed-author-link feed-author-name" href="' + esc(profileHref) + '">' + esc(author) + (isAllied(authorHash) ? " • Allié" : "") + "</a>" +
                "</div>" +
                media +
                '<h4 class="feed-title">' + esc(item.title) + "</h4>" +
                '<p class="feed-description" data-short="' + esc(desc.short || "Pas de témoignage.") + '" data-full="' + esc(desc.full) + '">' + esc(desc.short || "Pas de témoignage.") + "</p>" +
                (desc.truncated ? '<button class="feed-more-btn" data-feed-key="' + esc(key) + '" data-expanded="0">Voir plus</button>' : "") +
                '<p class="feed-meta">' + esc(item.meta) + esc(distance) + "</p>" +
                '<div class="feed-actions-row">' +
                '<button class="feed-action-btn' + (voteFeedbackActive && item.type === "alert" ? " confirm-feedback" : "") + '" data-type="' + esc(item.type) + '" data-id="' + Number(item.id || 0) + '">' + (item.type === "alert" ? ('<span class="icon-label">' + (voteFeedbackActive ? "👍" : iconSvg("checkCircle")) + '<span>' + actionLabel + " (" + Number(item.count || 0) + ")</span></span>") : (actionLabel + " (" + Number(item.count || 0) + ")")) + "</button>" +
                moodButtons +
                debateAction +
                reactButton +
                (item.type === "alert" ? ('<button class="whatsapp-btn" data-wa-key="' + esc(key) + '"><span class="icon-label">' + iconSvg("whatsapp") + '<span>Envoyer sur WhatsApp</span></span></button>') : "") +
                "</div>" +
                reactionPreview +
                reactionPanel +
                "</li>"
            );
        });
        el.feedList.innerHTML = html.join("");
    }

    function openFeedDetail(item) {
        if (!item || !el.feedDetailModal || !el.feedDetailBody) return;
        S.activeFeedDetailId = Number(item.id || 0);
        let media = "";
        if (item.media_type === "video" && item.media_url) {
            media = '<video class="feed-detail-media" controls playsinline preload="metadata" src="' + esc(item.media_url) + '"></video>';
        } else if (item.media_type === "image" && item.media_url) {
            media = '<img class="feed-detail-media" src="' + esc(item.media_url) + '" alt="Media détail">';
        } else if (item.media_type === "audio" && item.media_url) {
            media = '<div class="feed-media-wrap audio-live">' + customAudioPlayerHtml(item.media_url, { extraClass: "feed-detail-media", metaLabel: "Lecture detail" }) + '<span class="media-type-icon">🎵</span></div>';
        }
        const voteCount = Number(item.validation_count || item.count || 0);
        const criticalVotes = voteCount > 10;
        const voteFeedbackActive = Boolean(S.voteFeedbackIds[String(item.id || 0)]);
        const relativeTime = formatRelativeTime(item.created_at);
        const pollFeedback = S.pollFeedbackIds[String(item.id || 0)] || "";
        const supportCount = Number(item.support_count || 0);
        const compassionCount = Number(item.compassion_count || 0);
        const myMood = String(item.my_mood || "");
        el.feedDetailBody.innerHTML =
            media +
            '<h3 id="feed-detail-title" class="feed-detail-title">' + esc(item.title) + "</h3>" +
            '<div class="feed-detail-meta-line">' +
            '<p class="feed-detail-meta">' + esc(item.type === "alert" ? "Alerte" : "Savoir") + " • " + esc(item.category_label || item.meta || "") + " • " + esc(new Date(item.created_at).toLocaleString()) + "</p>" +
            (relativeTime ? ('<span class="relative-time-badge">' + esc(relativeTime) + "</span>") : "") +
            "</div>" +
            (item.type === "alert" ? ('<span class="popup-status ' + getSignalementStatus(item.status).css + '">' + getSignalementStatus(item.status).label + "</span>") : "") +
            '<p class="feed-detail-text">' + esc(item.description || "Aucun témoignage.") + "</p>" +
            (item.type === "alert" && item.is_poll
                ? (
                    '<div class="feed-detail-actions">' +
                    '<button class="admin-survey-btn yes" data-poll-signalement-answer="YES" data-id="' + Number(item.id || 0) + '">' + (pollFeedback === "YES" ? "🟢 Oui" : "Oui") + "</button>" +
                    '<button class="admin-survey-btn no" data-poll-signalement-answer="NO" data-id="' + Number(item.id || 0) + '">' + (pollFeedback === "NO" ? "🔴 Non" : "Non") + "</button>" +
                    "</div>" +
                    '<div class="admin-survey-meter" style="--yes:' + Number(item.poll_yes_percentage || 0) + '%;--no:' + Number(item.poll_no_percentage || 0) + '%;"><span class="admin-survey-meter-yes"></span><span class="admin-survey-meter-no"></span></div>' +
                    '<p class="admin-survey-stats">' + Number(item.poll_yes_percentage || 0) + "% disent Oui / " + Number(item.poll_no_percentage || 0) + "% disent Non</p>"
                )
                : item.type === "alert"
                ? (
                    '<div class="feed-detail-actions">' +
                    '<button class="feed-detail-confirm-btn' + (voteFeedbackActive ? " is-feedback" : "") + '" data-feed-detail-vote-id="' + Number(item.id || 0) + '">' + (voteFeedbackActive ? "👍 Je confirme" : "✔ Je confirme") + "</button>" +
                    '<button class="feed-detail-confirm-btn mood-detail-btn' + (myMood === "SUPPORT" ? " is-feedback" : "") + '" data-mood="SUPPORT" data-id="' + Number(item.id || 0) + '">\uD83D\uDC4D ' + supportCount + "</button>" +
                    '<button class="feed-detail-confirm-btn mood-detail-btn sad' + (myMood === "SAD" ? " is-feedback" : "") + '" data-mood="SAD" data-id="' + Number(item.id || 0) + '">\uD83D\uDE22 ' + compassionCount + "</button>" +
                    '<button class="feed-detail-abuse-btn" data-report-abuse-id="' + Number(item.id || 0) + '">⚠ Signaler un contenu inapproprié</button>' +
                    '<span class="feed-detail-votes' + (criticalVotes ? " critical" : "") + '">' + voteCount + " confirmation" + (voteCount > 1 ? "s" : "") + "</span>" +
                    "</div>"
                )
                : "");
        el.feedDetailModal.classList.add("open");
    }

    function closeFeedDetail() {
        if (!el.feedDetailModal) return;
        el.feedDetailModal.classList.remove("open");
        S.activeFeedDetailId = 0;
    }

    async function buildWhatsAppPoster(item) {
        const c = document.createElement("canvas");
        c.width = 1080;
        c.height = 1350;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#08172d";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#103963";
        ctx.fillRect(36, 36, c.width - 72, c.height - 72);
        ctx.fillStyle = "#00e5ff";
        ctx.font = "bold 52px Segoe UI";
        ctx.fillText("SemaChat", 86, 130);
        ctx.fillStyle = "#e7f5ff";
        ctx.font = "bold 44px Segoe UI";
        ctx.fillText(item.title || "Signalement", 86, 215);
        ctx.font = "28px Segoe UI";
        ctx.fillStyle = "#b9dcff";
        ctx.fillText("Categorie: " + (item.category_label || "Alerte"), 86, 278);
        ctx.fillText("Heure: " + new Date(item.created_at).toLocaleString(), 86, 322);
        ctx.fillStyle = "#d8ebff";
        const text = String(item.description || "Aucun témoignage");
        ctx.font = "30px Segoe UI";
        const wrapped = text.slice(0, 260) + (text.length > 260 ? "..." : "");
        ctx.fillText(wrapped, 86, 384, 910);

        if (item.media_type === "image" && item.media_url) {
            try {
                const img = await loadImage(item.media_url);
                ctx.drawImage(img, 86, 430, 910, 760);
            } catch (_e) {}
        }

        if (item.media_type === "video") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.fillRect(86, 430, 910, 760);
            ctx.fillStyle = "#e8f7ff";
            ctx.font = "bold 120px Segoe UI";
            ctx.fillText("▶", 500, 835);
            ctx.font = "30px Segoe UI";
            ctx.fillText("Vidéo jointe", 450, 890);
        }

        return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
    }

    async function shareFeedToWhatsApp(key) {
        const item = S.feedItems.find((x) => (x.type + "-" + Number(x.id || 0)) === key);
        if (!item) return;
        try {
            const blob = await buildWhatsAppPoster(item);
            if (!blob) throw new Error("poster");
            const file = new File([blob], "kolona-whatsapp-" + item.id + ".png", { type: "image/png" });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: "SemaChat",
                    text: "Signalement citoyen à partager",
                    files: [file]
                });
                return;
            }
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            const text = encodeURIComponent("Signalement SemaChat: " + item.title + " " + window.location.href);
            window.open("https://wa.me/?text=" + text, "_blank");
        } catch (_e) {
            showToast("Partage WhatsApp indisponible.");
        }
    }

    async function loadFeedData() {
        try {
            const params = new URLSearchParams();
            params.set("unique_device_id", getDeviceId());
            if (S.userGeo) {
                params.set("lat", String(S.userGeo.lat));
                params.set("lng", String(S.userGeo.lng));
            }

            const [sr, kr] = await Promise.all([
                fetch("/api/signalements/" + (params.toString() ? "?" + params.toString() : "")),
                fetch("/api/ressources/")
            ]);
            if (!sr.ok || !kr.ok) throw new Error("feed-load");
            const alertsRaw = await sr.json();
            const knowRaw = await kr.json();

            const alerts = alertsRaw.map((a) => {
                const lat = Number(a.lat);
                const lng = Number(a.lng);
                const distance = S.userGeo && Number.isFinite(lat) && Number.isFinite(lng)
                    ? haversineMeters(S.userGeo.lat, S.userGeo.lng, lat, lng)
                    : Number.POSITIVE_INFINITY;
                return {
                    type: "alert",
                    id: a.id,
                    title: a.title,
                    meta: (getVisual(a.category).label || "Alerte") + " • " + new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    category_label: getVisual(a.category).label || "Alerte",
                    description: a.description || "",
                    author_hash: a.reporter_hash || "",
                    author_label: a.author_label || "",
                    author_profile_id: Number(a.author_profile_id || 0),
                    publish_anonymously: Boolean(a.publish_anonymously),
                    status: a.status || "PENDING",
                    is_poll: Boolean(a.is_poll),
                    created_at: a.created_at,
                    distance_m: Number.isFinite(distance) ? distance : null,
                    count: Number(a.validation_count || 0),
                    poll_yes_count: Number(a.poll_yes_count || 0),
                    poll_no_count: Number(a.poll_no_count || 0),
                    poll_total_count: Number(a.poll_total_count || 0),
                    poll_yes_percentage: Number(a.poll_yes_percentage || 0),
                    poll_no_percentage: Number(a.poll_no_percentage || 0),
                    support_count: Number(a.support_count || 0),
                    compassion_count: Number(a.compassion_count || 0),
                    my_mood: String(a.my_mood || ""),
                    reaction_count: Number(a.reaction_count || 0),
                    recent_reactions: Array.isArray(a.recent_reactions) ? a.recent_reactions : [],
                    live: isLive(a.created_at),
                    media_type: a.video ? "video" : (a.image ? "image" : (a.audio ? "audio" : null)),
                    media_url: a.video || a.image || a.audio || null
                };
            }).sort((x, y) => {
                const xAlly = isAllied(x.author_hash) ? 0 : 1;
                const yAlly = isAllied(y.author_hash) ? 0 : 1;
                if (xAlly !== yAlly) return xAlly - yAlly;
                const xNear = Number.isFinite(x.distance_m) && x.distance_m < 500 ? 0 : 1;
                const yNear = Number.isFinite(y.distance_m) && y.distance_m < 500 ? 0 : 1;
                if (xNear !== yNear) return xNear - yNear;
                const dx = Number.isFinite(x.distance_m) ? x.distance_m : Number.POSITIVE_INFINITY;
                const dy = Number.isFinite(y.distance_m) ? y.distance_m : Number.POSITIVE_INFINITY;
                if (dx !== dy) return dx - dy;
                return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
            });

            const knowledges = knowRaw.map((k) => ({
                type: "knowledge",
                id: k.id,
                title: k.title,
                meta: (k.category || "Savoir") + " • #" + (k.institution || "Campus"),
                category_label: k.category || "Savoir",
                description: k.content || "",
                author_hash: k.contributor_hash || "",
                author_profile_id: Number(k.author_profile_id || 0),
                created_at: k.created_at,
                distance_m: null,
                count: Number(k.thanks_count || 0),
                live: isLive(k.created_at),
                media_type: null,
                media_url: null
            })).sort((x, y) => {
                const xAlly = isAllied(x.author_hash) ? 0 : 1;
                const yAlly = isAllied(y.author_hash) ? 0 : 1;
                if (xAlly !== yAlly) return xAlly - yAlly;
                return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
            });

            S.feedItems = interleaveFeed(alerts, knowledges).slice(0, 60);
            await loadLeaderboard(20);
            renderFeed();
            notifyAlliedImportantResources(knowRaw);
        } catch (_e) {
            if (el.feedList) {
                el.feedList.innerHTML = '<li class="feed-item">Actualités indisponibles.</li>';
            }
        }
    }

    function openFeedPanel() {
        if (!el.feedPanel) return;
        setBottomNavActive("feed");
        closeKnowledgePanel();
        closeStatsPanel();
        closeSocialProfile();
        el.feedPanel.classList.add("open");
        loadFeedData();
    }

    function closeFeedPanel() {
        if (!el.feedPanel) return;
        el.feedPanel.classList.remove("open");
        closeFeedDetail();
        closeSocialProfile();
        closeFeedReactionRecorder();
    }

    function bootstrapUserGeo() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            S.userGeo = {
                lat: Number(pos.coords.latitude.toFixed(6)),
                lng: Number(pos.coords.longitude.toFixed(6))
            };
            refreshNeighborhoodChatButton();
            loadFeedData();
        }, () => {}, { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 });
    }

    async function sendMerci(resourceId) {
        try {
            const res = await fetch("/api/ressources/" + resourceId + "/merci/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({ unique_device_id: getDeviceId() })
            });
            if (!res.ok) throw new Error("merci");
            const payload = await res.json();
            const item = S.knowledgeItems.find((x) => Number(x.id) === Number(resourceId));
            if (item) {
                item.thanks_count = Number(payload.thanks_count || item.thanks_count || 0);
                renderKnowledgeList();
            }
            showToast(payload.created ? "Merci envoyé." : "Vous avez déjà dit merci.");
        } catch (_e) {
            showToast("Action indisponible.");
        }
    }

    async function loadKnowledgeContributionCount() {
        try {
            const data = await fetchSocialProfile(getDeviceId(), false);
            S.knowledgeContributionCount = Number(data.knowledge_contribution_count || 0);
            if (el.knowledgeBadge) {
                el.knowledgeBadge.style.display = data.reliability_badge ? "inline-flex" : "none";
                el.knowledgeBadge.textContent = data.reliability_badge || "Éclaireur";
            }
            syncProfileStats();
        } catch (_e) {}
    }

    function openKnowledgePanel() {
        setBottomNavActive("knowledge");
        el.notifPanel.classList.remove("open");
        el.menuDrawer.classList.remove("open");
        el.profileDrawer.classList.remove("open");
        el.drawerBackdrop.classList.remove("open");
        closeFeedPanel();
        el.knowledgePanel.classList.add("open");
        el.statsPanel.classList.remove("open");
        loadKnowledgeResources();
    }

    function closeKnowledgePanel() {
        el.knowledgePanel.classList.remove("open");
    }

    function toggleHeatmapMode() {
        S.heatmapMode = !S.heatmapMode;
        applyFilter();
        closeMenuDrawerWithDelay(300);
    }

    async function loadSignalements() {
        try {
            const params = new URLSearchParams({ unique_device_id: getDeviceId() });
            const res = await fetch("/api/signalements/?" + params.toString());
            if (!res.ok) throw new Error("load");
            const reports = await res.json();
            S.latestHistoryAudioTs = reports.reduce((acc, item) => {
                if (!item.audio || !item.created_at) return acc;
                const ts = new Date(item.created_at).getTime();
                return ts > acc ? ts : acc;
            }, 0);
            syncHistoryAudioBadge();
            reports.sort((a, b) => {
                const aAlly = isAllied(a.reporter_hash || "") ? 0 : 1;
                const bAlly = isAllied(b.reporter_hash || "") ? 0 : 1;
                if (aAlly !== bAlly) return aAlly - bAlly;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            S.totalReports = reports.length;
            syncProfileStats();
            S.markerStore.forEach((entry) => {
                if (entry.hideTimer) {
                    window.clearTimeout(entry.hideTimer);
                    entry.hideTimer = null;
                }
                if (map.hasLayer(entry.marker)) map.removeLayer(entry.marker);
            });
            S.markerStore = [];
            reports.forEach((r) => addMarker(r, false));
        } catch (_e) {}
    }

    function attachRipple(btn) {
        btn.addEventListener("pointerdown", (e) => {
            const r = document.createElement("span");
            r.className = "ripple-dot";
            const box = btn.getBoundingClientRect();
            r.style.left = (e.clientX - box.left) + "px";
            r.style.top = (e.clientY - box.top) + "px";
            btn.appendChild(r);
            window.setTimeout(() => r.remove(), 540);
        });
    }

    document.addEventListener("click", (e) => {
        const audioToggle = e.target.closest(".audio-play-toggle");
        if (audioToggle) {
            const player = audioToggle.closest(".custom-audio-player");
            const audio = player ? getCustomPlayerAudio(player) : null;
            if (!audio) return;
            if (audio.paused) {
                player.classList.add("is-active");
                player.classList.add("playing-now");
                player.classList.remove("is-fading");
                audio.play().catch(() => {
                    player.classList.remove("is-active");
                    player.classList.remove("playing-now");
                });
            } else {
                player.classList.remove("is-active");
                player.classList.remove("playing-now");
                audio.pause();
            }
            return;
        }
        const socialFollow = e.target.closest("#social-follow-btn");
        if (socialFollow && S.activeSocialHash) {
            toggleFollow(S.activeSocialHash);
            return;
        }
        const socialAlly = e.target.closest("#social-ally-btn");
        if (socialAlly && S.activeSocialHash) {
            toggleAlly(S.activeSocialHash);
            return;
        }
        const socialMessage = e.target.closest("#social-message-btn");
        if (socialMessage && S.activeSocialHash) {
            openDirectChat(S.activeSocialHash, socialMessage.getAttribute("data-target-name") || "");
            return;
        }
        const moodBtn = e.target.closest("[data-mood][data-id]");
        if (moodBtn) {
            reactSignalementMood(moodBtn.getAttribute("data-id"), moodBtn.getAttribute("data-mood"));
            return;
        }
        const searchAreaBtn = e.target.closest("[data-search-area-key]");
        if (searchAreaBtn) {
            const area = SEARCH_AREA_INDEX[searchAreaBtn.getAttribute("data-search-area-key") || ""];
            if (area) setMapSearchAnchor(area);
            setMapLegendOpen(false);
            return;
        }
        const pollSignalementAnswer = e.target.closest("[data-poll-signalement-answer]");
        if (pollSignalementAnswer) {
            return submitSignalementPollVote(
                pollSignalementAnswer.getAttribute("data-id"),
                pollSignalementAnswer.getAttribute("data-poll-signalement-answer")
            );
        }
        const adminSurveyAnswer = e.target.closest("[data-admin-survey-answer]");
        if (adminSurveyAnswer) {
            return submitSurvey(
                adminSurveyAnswer.getAttribute("data-admin-survey-answer"),
                adminSurveyAnswer.getAttribute("data-broadcast-id")
            );
        }
        const openBroadcastThreadBtn = e.target.closest("[data-open-broadcast-thread]");
        if (openBroadcastThreadBtn) {
            return openBroadcastThread(openBroadcastThreadBtn.getAttribute("data-open-broadcast-thread"));
        }
        const abuseReportBtn = e.target.closest("[data-report-abuse-id]");
        if (abuseReportBtn) return reportSignalementAbuse(abuseReportBtn.getAttribute("data-report-abuse-id"));
        const detailVote = e.target.closest("[data-feed-detail-vote-id]");
        if (detailVote) return voteSignalement(detailVote.getAttribute("data-feed-detail-vote-id"));
        const v = e.target.closest(".vote-btn");
        if (v) return voteSignalement(v.dataset.id);
        const s = e.target.closest(".share-btn");
        if (s) return shareSignalement(s.dataset.id);
        const d = e.target.closest(".debate-btn");
        if (d) return openDebateModal(d.dataset.id);
        const m = e.target.closest(".merci-btn");
        if (m) return sendMerci(m.dataset.id);
        const knowledgeShare = e.target.closest("[data-knowledge-share]");
        if (knowledgeShare) {
            shareKnowledgeToWhatsApp(knowledgeShare.getAttribute("data-knowledge-share"));
            return;
        }
        const knowledgeQr = e.target.closest("[data-knowledge-qr]");
        if (knowledgeQr) {
            const item = S.knowledgeLibraryAll.find((row) => Number(row.id || 0) === Number(knowledgeQr.getAttribute("data-knowledge-qr") || 0))
                || S.knowledgeItems.find((row) => Number(row.id || 0) === Number(knowledgeQr.getAttribute("data-knowledge-qr") || 0));
            if (item) openKnowledgeQr(item);
            return;
        }
        const knowledgeFlyer = e.target.closest("[data-knowledge-flyer]");
        if (knowledgeFlyer) {
            const item = S.knowledgeLibraryAll.find((row) => Number(row.id || 0) === Number(knowledgeFlyer.getAttribute("data-knowledge-flyer") || 0))
                || S.knowledgeItems.find((row) => Number(row.id || 0) === Number(knowledgeFlyer.getAttribute("data-knowledge-flyer") || 0));
            if (item) {
                openKnowledgeQr(item);
                window.setTimeout(() => generateKnowledgeFlyer(), 120);
            }
            return;
        }
        const knowledgeMention = e.target.closest("[data-knowledge-mention][data-id]");
        if (knowledgeMention) {
            mentionKnowledgeResource(
                knowledgeMention.getAttribute("data-id"),
                knowledgeMention.getAttribute("data-knowledge-mention")
            );
            return;
        }
        const knowledgeOpenFile = e.target.closest("[data-knowledge-open-file]");
        if (knowledgeOpenFile) {
            citeKnowledgeResource(knowledgeOpenFile.getAttribute("data-knowledge-open-file"), "DOWNLOAD");
            return;
        }
        const knowledgeOpenLink = e.target.closest("[data-knowledge-open-link]");
        if (knowledgeOpenLink) {
            citeKnowledgeResource(knowledgeOpenLink.getAttribute("data-knowledge-open-link"), "DOWNLOAD");
            return;
        }
        const wa = e.target.closest(".whatsapp-btn");
        if (wa) {
            shareFeedToWhatsApp(wa.getAttribute("data-wa-key"));
            return;
        }
        const historyShare = e.target.closest(".history-share-btn");
        if (historyShare) {
            shareSignalement(historyShare.getAttribute("data-id"));
            return;
        }
        const authorLink = e.target.closest(".feed-author-link");
        if (authorLink) {
            return;
        }
        const more = e.target.closest(".feed-more-btn");
        if (more) {
            const row = e.target.closest(".feed-item");
            toggleFeedDescription(row, more);
            return;
        }
        const reactionToggle = e.target.closest(".reaction-toggle-btn");
        if (reactionToggle) {
            toggleReactionPanel(reactionToggle.getAttribute("data-id"));
            return;
        }
        const reactionMode = e.target.closest(".reaction-mode-btn[data-mode]");
        if (reactionMode) {
            const id = Number(reactionMode.getAttribute("data-id") || 0);
            const panel = reactionPanelById(id);
            switchReactionMode(panel, reactionMode.getAttribute("data-mode"));
            return;
        }
        const reactionStart = e.target.closest(".reaction-start-voice-btn");
        if (reactionStart) {
            const id = Number(reactionStart.getAttribute("data-id") || 0);
            const panel = reactionPanelById(id);
            startFeedVoiceReaction(id, panel);
            return;
        }
        const reactionStop = e.target.closest(".reaction-stop-voice-btn");
        if (reactionStop) {
            closeFeedReactionRecorder();
            return;
        }
        const reactionReset = e.target.closest(".reaction-reset-btn");
        if (reactionReset) {
            const panel = reactionPanelById(Number(reactionReset.getAttribute("data-id") || 0));
            closeFeedReactionRecorder();
            resetFeedReactionPreview(panel);
            showToast("Audio supprimé. Tu peux recommencer.", "filter-confirm");
            return;
        }
        const reactionSendText = e.target.closest(".reaction-send-text-btn");
        if (reactionSendText) {
            const id = Number(reactionSendText.getAttribute("data-id") || 0);
            const panel = reactionPanelById(id);
            sendTextReaction(id, panel);
            return;
        }
        const reactionSendVoice = e.target.closest(".reaction-send-voice-btn");
        if (reactionSendVoice) {
            const id = Number(reactionSendVoice.getAttribute("data-id") || 0);
            const panel = reactionPanelById(id);
            sendVoiceReaction(id, panel);
            return;
        }
        const reactionDelete = e.target.closest(".reaction-delete-btn");
        if (reactionDelete) {
            const panel = e.target.closest(".reaction-panel");
            const signalementId = Number(panel && panel.getAttribute("data-id") || 0);
            const reactionId = Number(reactionDelete.getAttribute("data-reaction-id") || 0);
            deleteReaction(signalementId, reactionId, panel);
            return;
        }
        const fa = e.target.closest(".feed-action-btn");
        if (fa) {
            if (fa.dataset.type === "alert") return voteSignalement(fa.dataset.id).then(loadFeedData);
            return sendMerci(fa.dataset.id).then(loadFeedData);
        }
        if (e.target.closest(".reaction-panel")) {
            return;
        }
        const fi = e.target.closest(".feed-item[data-feed-key]");
        if (fi) {
            const key = fi.getAttribute("data-feed-key");
            const item = S.feedItems.find((x) => (x.type + "-" + Number(x.id || 0)) === key);
            if (item) openFeedDetail(item);
        }
        if (el.mapSearchSuggestions && !e.target.closest(".map-search-wrap") && !e.target.closest(".map-search-suggestions")) {
            S.mapSearchSuggestions = [];
            renderMapSearchSuggestions();
        }
        if (el.mapLegendPanel && !e.target.closest("#map-legend-panel") && !e.target.closest("#map-legend-toggle-btn")) {
            setMapLegendOpen(false);
        }
    });

    document.addEventListener("mouseover", (e) => {
        const video = e.target.closest(".feed-media-video");
        if (!video) return;
        video.play().catch(() => {});
    });

    document.addEventListener("mouseout", (e) => {
        const video = e.target.closest(".feed-media-video");
        if (!video) return;
        video.pause();
        video.currentTime = 0;
    });

    el.openModalBtn.addEventListener("click", () => {
        el.modal.classList.add("open");
        el.gpsStatus.textContent = "Localisation: recuperation GPS...";
        S.currentCoords = null;
        clearMediaPreview();
        selectReportCategory(defaultReportCategory(), { silent: true });
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            S.currentCoords = { lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) };
            el.gpsStatus.textContent = "GPS détecté : " + S.currentCoords.lat + ", " + S.currentCoords.lng;
        }, () => { el.gpsStatus.textContent = "Impossible de récupérer le GPS."; }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
    });

    el.closeModalBtn.addEventListener("click", () => el.modal.classList.remove("open"));
    el.modal.addEventListener("click", (e) => { if (e.target === el.modal) el.modal.classList.remove("open"); });

    el.categoryButtons.forEach((btn) => {
        btn.addEventListener("pointerdown", () => btn.classList.add("press"));
        btn.addEventListener("pointerup", () => btn.classList.remove("press"));
        btn.addEventListener("pointerleave", () => btn.classList.remove("press"));
        btn.addEventListener("click", () => {
            selectReportCategory(btn.dataset.value, { autoRecord: true });
        });
    });

    if (el.menuFilterButtons && el.menuFilterButtons.length) {
        el.menuFilterButtons.forEach((btn) => btn.addEventListener("click", () => {
            setMapFilter(btn.dataset.filter);
        }));
    }

    if (el.heatmapToggleBtn) el.heatmapToggleBtn.addEventListener("click", toggleHeatmapMode);

    el.mediaModeButtons.forEach((btn) => {
        btn.addEventListener("click", () => setMediaMode(btn.dataset.mediaMode));
    });

    if (el.audioRecordStartBtn) {
        el.audioRecordStartBtn.addEventListener("click", () => {
            startReportAudioRecording();
        });
    }
    if (el.audioRecordStopBtn) {
        el.audioRecordStopBtn.addEventListener("click", () => {
            stopReportAudioRecording();
        });
    }
    if (el.audioRecordResetBtn) {
        el.audioRecordResetBtn.addEventListener("click", () => {
            resetRecordedAudio();
            showToast("Audio supprimé. Tu peux recommencer.", "filter-confirm");
        });
    }

    el.photoInput.addEventListener("change", () => {
        const f = el.photoInput.files && el.photoInput.files[0] ? el.photoInput.files[0] : null;
        if (!f) return clearMediaPreview();
        const r = new FileReader();
        r.onload = (ev) => {
            clearMediaPreview();
            el.photoPreview.src = ev.target.result;
            el.photoPreview.classList.add("show");
            el.cameraIcon.style.display = "none";
        };
        r.readAsDataURL(f);
    });

    el.videoInput.addEventListener("change", () => {
        const f = el.videoInput.files && el.videoInput.files[0] ? el.videoInput.files[0] : null;
        if (!f) return clearMediaPreview();
        if (f.size > 15 * 1024 * 1024) {
            showToast("Vidéo trop lourde: max 15Mo.");
            el.videoInput.value = "";
            return clearMediaPreview();
        }

        const tempUrl = URL.createObjectURL(f);
        el.videoPreview.onloadedmetadata = () => {
            const duration = Number(el.videoPreview.duration || 0);
            if (duration > 15) {
                showToast("Vidéo trop longue: max 15 secondes.");
                el.videoInput.value = "";
                URL.revokeObjectURL(tempUrl);
                return clearMediaPreview();
            }

            // Note compression: integrate a lightweight transcoding step here (ffmpeg.wasm/WebCodecs)
            // before upload on low bandwidth mobile connections.
            clearMediaPreview();
            el.videoDurationInput.value = duration.toFixed(2);
            el.videoPreview.src = tempUrl;
            el.videoPreview.classList.add("show");
            el.videoPreview.muted = true;
            el.videoPreview.play().catch(() => {});
            el.cameraIcon.style.display = "none";
        };
        el.videoPreview.src = tempUrl;
    });

    el.reportForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!S.currentCoords) return showToast("Active ta localisation GPS avant d'envoyer.");
        startSubmitFeedback();
        const fd = new FormData(el.reportForm);
        fd.set("category", el.categoryInput.value);
        fd.set("title", document.getElementById("title-input").value.trim());
        fd.set("description", document.getElementById("description-input").value.trim());
        fd.set("lat", String(S.currentCoords.lat));
        fd.set("lng", String(S.currentCoords.lng));
        fd.set("reporter_hash", getDeviceId());
        fd.set("publish_anonymously", el.publishAnonymouslyInput && el.publishAnonymouslyInput.checked ? "true" : "false");
        fd.set("is_poll", el.isPollInput && el.isPollInput.checked ? "true" : "false");
        const mode = el.mediaTypeInput.value;
        if (mode === "video" && el.videoInput.files && el.videoInput.files[0]) {
            let uploadVideo = el.videoInput.files[0];
            if (S.dataSaverEnabled) {
                try {
                    el.submitBtn.querySelector(".btn-label-default").textContent = "Compression vidéo...";
                    const compressed = await compressVideoForMobile(uploadVideo);
                    uploadVideo = compressed.file || uploadVideo;
                    if (compressed.compressed) {
                        showToast("Vidéo compressée pour économiser les données.");
                    }
                } catch (_e) {}
            }

            let duration = Number(el.videoDurationInput.value || 0);
            try {
                const meta = await readVideoMeta(uploadVideo);
                duration = Number(meta.duration || duration || 0);
            } catch (_e) {}

            fd.set("video", uploadVideo);
            fd.set("video_duration_sec", String(duration || 0));
            fd.delete("image");
            fd.delete("audio");
        } else if (mode === "audio") {
            let uploadAudioBlob = S.reportAudioBlob;
            if (uploadAudioBlob && S.dataSaverEnabled) {
                try {
                    const label = el.submitBtn.querySelector(".btn-label-default");
                    if (label) label.textContent = "Compression audio...";
                    const compressed = await compressAudioForMobile(uploadAudioBlob);
                    uploadAudioBlob = compressed.blob || uploadAudioBlob;
                    if (compressed.compressed) {
                        showToast("Audio compressé pour économiser les données.");
                    }
                } catch (_e) {}
            }
            if (S.reportAudioBlob && S.reportAudioBlob.size > 0) {
                const audioFile = new File(
                    [uploadAudioBlob],
                    "signalement-audio-" + Date.now() + ".webm",
                    { type: (uploadAudioBlob && uploadAudioBlob.type) || "audio/webm" }
                );
                fd.set("audio", audioFile);
            } else if (el.audioInput && el.audioInput.files && el.audioInput.files[0]) {
                let inputAudio = el.audioInput.files[0];
                if (S.dataSaverEnabled) {
                    try {
                        const label = el.submitBtn.querySelector(".btn-label-default");
                        if (label) label.textContent = "Compression audio...";
                        const compressed = await compressAudioForMobile(inputAudio);
                        inputAudio = compressed.blob || inputAudio;
                        if (compressed.compressed) {
                            showToast("Audio compressé pour économiser les données.");
                        }
                    } catch (_e) {}
                }
                const inputAudioFile = inputAudio instanceof File
                    ? inputAudio
                    : new File([inputAudio], "signalement-audio-" + Date.now() + ".webm", { type: inputAudio.type || "audio/webm" });
                fd.set("audio", inputAudioFile);
            } else {
                showToast("Enregistre un audio avant d'envoyer.");
                resetSubmitFeedback();
                return;
            }
            fd.delete("image");
            fd.delete("video");
            fd.delete("video_duration_sec");
        } else if (el.photoInput.files && el.photoInput.files[0]) {
            fd.set("image", el.photoInput.files[0]);
            fd.delete("video");
            fd.delete("video_duration_sec");
            fd.delete("audio");
        } else {
            fd.delete("image");
            fd.delete("video");
            fd.delete("video_duration_sec");
            fd.delete("audio");
        }
        if (!navigator.onLine) {
            try {
                await queueCurrentReport();
                resetSubmitFeedback();
                el.reportForm.reset();
                clearMediaPreview();
                el.mediaTypeInput.value = "photo";
                el.mediaModeButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mediaMode === "photo"));
                el.cameraIcon.textContent = "📷";
                el.photoOrb.setAttribute("for", "photo-input");
                el.photoOrb.style.display = "flex";
                if (el.audioRecorderBox) el.audioRecorderBox.classList.remove("active");
                if (el.isPollInput) el.isPollInput.checked = false;
                selectReportCategory(defaultReportCategory(), { silent: true });
                showToast("Connexion faible. Ton message sera envoyé automatiquement dès le retour du réseau.");
                el.modal.classList.remove("open");
            } catch (_e) {
                resetSubmitFeedback();
                showToast("Impossible de sauvegarder ce message hors-ligne.");
            }
            return;
        }
        try {
            const res = await fetch("/api/signalements/", { method: "POST", credentials: "same-origin", headers: { "X-CSRFToken": getCookie("csrftoken") || "" }, body: fd });
            if (!res.ok) throw new Error("post");
            const data = await res.json();
            addMarker(data, true);
            S.totalReports += 1;
            S.sessionReports += 1;
            syncProfileStats();
            markSubmitSuccess();
            addNotification("Nouveau signalement publié dans votre zone.", true);
            notifyLocal("Bravo ! Votre signalement est en cours de validation par la communauté");
            showToast("Ta voix a été enregistrée sur SemaChat !", "voice-success");
            loadSelfProfile();
            el.reportForm.reset();
            clearMediaPreview();
            el.mediaTypeInput.value = "photo";
            el.mediaModeButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mediaMode === "photo"));
            el.cameraIcon.textContent = "📷";
            el.photoOrb.setAttribute("for", "photo-input");
            el.photoOrb.style.display = "flex";
            if (el.audioRecorderBox) el.audioRecorderBox.classList.remove("active");
            if (el.isPollInput) el.isPollInput.checked = false;
            selectReportCategory(defaultReportCategory(), { silent: true });
            window.setTimeout(() => { el.modal.classList.remove("open"); resetSubmitFeedback(); }, 2000);
        } catch (_err) {
            try {
                await queueCurrentReport();
                resetSubmitFeedback();
                el.reportForm.reset();
                clearMediaPreview();
                el.mediaTypeInput.value = "photo";
                el.mediaModeButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mediaMode === "photo"));
                el.cameraIcon.textContent = "📷";
                el.photoOrb.setAttribute("for", "photo-input");
                el.photoOrb.style.display = "flex";
                if (el.audioRecorderBox) el.audioRecorderBox.classList.remove("active");
                if (el.isPollInput) el.isPollInput.checked = false;
                selectReportCategory(defaultReportCategory(), { silent: true });
                showToast("Connexion faible. Ton message sera envoyé automatiquement dès le retour du réseau.");
                el.modal.classList.remove("open");
            } catch (_queueErr) {
                resetSubmitFeedback();
                showToast("Envoi impossible. Réessaie.");
            }
        } finally {
            const label = el.submitBtn.querySelector(".btn-label-default");
            if (label) label.textContent = "Envoyer mon signalement";
        }
    });

    document.querySelectorAll(".bottom-nav button").forEach(attachRipple);
    setBottomNavActive("map");

    el.openProfileBtn.addEventListener("click", () => { openProfileDrawerFor(getDeviceId()); });
    el.openProfileBtnBottom.addEventListener("click", () => {
        setBottomNavActive("user");
        window.location.href = "/profil/";
    });
    el.closeProfileBtn.addEventListener("click", () => {
        el.profileDrawer.classList.remove("open");
        S.viewedProfileHash = "";
        setBottomNavActive("map");
        if (!el.menuDrawer.classList.contains("open")) el.drawerBackdrop.classList.remove("open");
    });
        el.openMenuBtn.addEventListener("click", () => { el.profileDrawer.classList.remove("open"); el.menuDrawer.classList.add("open"); el.drawerBackdrop.classList.add("open"); syncMenuFilterState(); });
        el.closeMenuBtn.addEventListener("click", closeMenuDrawer);
    if (el.timeFilterSelect) {
        el.timeFilterSelect.addEventListener("change", async () => {
            S.timeFilter = el.timeFilterSelect.value === "48H" ? "48H" : "ALL";
            applyFilter();
            await loadSignalements();
        });
    }
    if (el.provinceFilterSelect) {
        el.provinceFilterSelect.addEventListener("change", async () => {
            const provinceKey = el.provinceFilterSelect.value || "";
            S.mapSearchAnchor = null;
            if (!provinceKey) {
                S.provinceFilter = "";
                applyFilter();
                if (!S.mapSearchQuery && S.activeFilter === "ALL") returnToDefaultMapView();
                return;
            }
            setProvinceFilter(provinceKey, { focus: true });
            await loadSignalements();
            const provinceMatches = S.markerStore.filter((entry) => matchesProvinceFilter(entry.data));
            if (!provinceMatches.length) {
                showToast("Aucun incident signalé dans " + (PROVINCE_INDEX[provinceKey] ? PROVINCE_INDEX[provinceKey].name : "cette province") + " pour l'instant");
            }
        });
    }
    if (el.mapSearchInput) {
        el.mapSearchInput.addEventListener("input", () => {
            S.mapSearchQuery = normalizeSearchText(el.mapSearchInput.value);
            S.mapSearchAnchor = null;
            S.mapSearchSuggestions = getSearchSuggestions(el.mapSearchInput.value);
            renderMapSearchSuggestions();
            syncMapSearchUi();
            applyFilter();
        });
    }
    if (el.mapSearchClearBtn) {
        el.mapSearchClearBtn.addEventListener("click", () => {
            S.mapSearchQuery = "";
            S.mapSearchAnchor = null;
            S.provinceFilter = "";
            S.mapSearchSuggestions = [];
            if (el.mapSearchInput) el.mapSearchInput.value = "";
            renderMapSearchSuggestions();
            syncProvinceFilterUi();
            syncMapSearchUi();
            refreshNeighborhoodChatButton();
            applyFilter();
            setMapLegendOpen(false);
            if (S.activeFilter === "ALL") returnToDefaultMapView();
        });
    }
    if (el.mapSearchLocateBtn) {
        el.mapSearchLocateBtn.addEventListener("click", () => {
            setMapLegendOpen(false);
            S.provinceFilter = "";
            syncProvinceFilterUi();
            if (S.userGeo) {
                S.mapSearchAnchor = { name: "Ma position", lat: S.userGeo.lat, lng: S.userGeo.lng };
                S.mapSearchSuggestions = [];
                renderMapSearchSuggestions();
                syncMapSearchUi();
                selectNeighborhoodZone({ lat: S.userGeo.lat, lng: S.userGeo.lng }, { source: "gps", flyTo: true });
                applyFilter();
                return;
            }
            if (!navigator.geolocation) {
                showToast("Géolocalisation indisponible.");
                return;
            }
            navigator.geolocation.getCurrentPosition((pos) => {
                S.userGeo = {
                    lat: Number(pos.coords.latitude.toFixed(6)),
                    lng: Number(pos.coords.longitude.toFixed(6)),
                };
                S.mapSearchAnchor = { name: "Ma position", lat: S.userGeo.lat, lng: S.userGeo.lng };
                S.mapSearchSuggestions = [];
                renderMapSearchSuggestions();
                syncMapSearchUi();
                selectNeighborhoodZone({ lat: S.userGeo.lat, lng: S.userGeo.lng }, { source: "gps", flyTo: true });
                applyFilter();
            }, () => showToast("Impossible d'accéder à ta position."));
        });
    }
    if (el.menuLinkMap) {
        el.menuLinkMap.addEventListener("click", () => {
            closeMenuDrawer();
            setMapLegendOpen(false);
            returnToDefaultMapView();
        });
    }
    if (el.mapLegendToggleBtn) {
        el.mapLegendToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleMapLegend();
        });
    }
    if (el.mapLegendCloseBtn) {
        el.mapLegendCloseBtn.addEventListener("click", () => setMapLegendOpen(false));
    }
    if (el.menuLinkHistory) {
        el.menuLinkHistory.addEventListener("click", () => {
            closeMenuDrawer();
            openGlobalHistoryModal();
        });
    }
    if (el.menuLinkHelp) {
        el.menuLinkHelp.addEventListener("click", () => {
            closeMenuDrawer();
            openHelpModal();
        });
    }
    if (el.menuLinkAbout) {
        el.menuLinkAbout.addEventListener("click", () => {
            closeMenuDrawer();
            openAboutModal();
        });
    }
    if (el.profileAdminControlBtn) {
        el.profileAdminControlBtn.addEventListener("click", () => {
            window.location.href = "/admin-control/";
        });
    }
    if (el.closeMenuInfoModal) el.closeMenuInfoModal.addEventListener("click", closeMenuInfoModal);
    if (el.menuInfoModal) {
        el.menuInfoModal.addEventListener("click", (e) => {
            if (e.target === el.menuInfoModal) closeMenuInfoModal();
        });
    }
    if (el.resetMapBtn) el.resetMapBtn.addEventListener("click", () => setMapFilter("ALL"));
    el.drawerBackdrop.addEventListener("click", () => {
        el.menuDrawer.classList.remove("open");
        el.profileDrawer.classList.remove("open");
        el.notifPanel.classList.remove("open");
        S.viewedProfileHash = "";
        el.drawerBackdrop.classList.remove("open");
        closeKnowledgePanel();
        closeSocialProfile();
        closeDebateModal();
    });

    el.notifBtn.addEventListener("click", () => {
        const open = !el.notifPanel.classList.contains("open");
        el.notifPanel.classList.toggle("open", open);
        if (open) {
            S.unreadNotifications = 0;
            renderNotifications();
            loadServerNotifications(true);
        }
    });

    if (el.adminBroadcastCloseBtn) {
        el.adminBroadcastCloseBtn.addEventListener("click", closeAdminBanner);
    }
    if (el.adminBroadcastThreadBtn) {
        el.adminBroadcastThreadBtn.addEventListener("click", () => {
            openBroadcastThread(S.lastAdminPayload && S.lastAdminPayload.id);
        });
    }
    if (el.adminBroadcastMapBtn) {
        el.adminBroadcastMapBtn.addEventListener("click", () => {
            if (S.lastPollSignalementId) {
                const pollEntry = findEntry(S.lastPollSignalementId);
                if (pollEntry) {
                    map.flyTo(pollEntry.marker.getLatLng(), Math.max(15, map.getZoom()), { duration: 0.9, easeLinearity: 0.25 });
                    pollEntry.marker.openPopup();
                } else {
                    openMapFromBroadcast();
                }
            } else {
                openMapFromBroadcast();
            }
            closeAdminBanner();
        });
    }
    if (el.closeBroadcastThreadBtn) el.closeBroadcastThreadBtn.addEventListener("click", closeBroadcastThread);
    if (el.broadcastThreadForm) {
        el.broadcastThreadForm.addEventListener("submit", (event) => {
            event.preventDefault();
            sendBroadcastComment();
        });
    }
    if (el.broadcastConfirmBtn) el.broadcastConfirmBtn.addEventListener("click", () => reactBroadcast("CONFIRM"));
    if (el.broadcastDisagreeBtn) el.broadcastDisagreeBtn.addEventListener("click", () => reactBroadcast("DISAGREE"));

    if (el.navStatsBtn) el.navStatsBtn.addEventListener("click", openStatsPanel);
    el.navMapBtn.addEventListener("click", () => { setBottomNavActive("map"); closeKnowledgePanel(); closeFeedPanel(); });
    el.navKnowledgeBtn.addEventListener("click", openKnowledgePanel);
    if (el.navFeedBtn) el.navFeedBtn.addEventListener("click", openFeedPanel);
    if (el.openStatsFromFeedBtn) el.openStatsFromFeedBtn.addEventListener("click", openStatsPanel);
    if (el.closeFeedBtn) el.closeFeedBtn.addEventListener("click", closeFeedPanel);
    if (el.closeFeedDetailBtn) el.closeFeedDetailBtn.addEventListener("click", closeFeedDetail);
    if (el.closeDebateBtn) el.closeDebateBtn.addEventListener("click", closeDebateModal);
    if (el.closeSocialProfileBtn) el.closeSocialProfileBtn.addEventListener("click", closeSocialProfile);
    if (el.feedDetailModal) {
        el.feedDetailModal.addEventListener("click", (e) => {
            if (e.target === el.feedDetailModal) closeFeedDetail();
        });
    }
    if (el.debateModal) {
        el.debateModal.addEventListener("click", (e) => {
            if (e.target === el.debateModal) closeDebateModal();
        });
    }
    if (el.socialProfileModal) {
        el.socialProfileModal.addEventListener("click", (e) => {
            if (e.target === el.socialProfileModal) closeSocialProfile();
        });
    }
    if (el.levelupModal) {
        el.levelupModal.addEventListener("click", (e) => {
            if (e.target === el.levelupModal) el.levelupModal.classList.remove("open");
        });
    }
    if (el.knowledgeQrModal) {
        el.knowledgeQrModal.addEventListener("click", (e) => {
            if (e.target === el.knowledgeQrModal) closeKnowledgeQr();
        });
    }
    if (el.levelModeFastBtn) el.levelModeFastBtn.addEventListener("click", () => setProgressionMode("fast"));
    if (el.levelModeCompetitiveBtn) el.levelModeCompetitiveBtn.addEventListener("click", () => setProgressionMode("competitive"));
    if (el.closeStatsBtn) el.closeStatsBtn.addEventListener("click", closeStatsPanel);
    el.closeKnowledgeBtn.addEventListener("click", closeKnowledgePanel);
    if (el.closeKnowledgeQrBtn) el.closeKnowledgeQrBtn.addEventListener("click", closeKnowledgeQr);
    if (el.knowledgeFlyerBtn) el.knowledgeFlyerBtn.addEventListener("click", generateKnowledgeFlyer);
    el.myReportsBtn.addEventListener("click", () => {
        window.location.href = "/profil/";
    });
    if (el.profileAllyBtn) {
        el.profileAllyBtn.addEventListener("click", () => {
            if (!S.viewedProfileHash || S.viewedProfileHash === getDeviceId()) return;
            sendAllyRequestFromDrawer(S.viewedProfileHash);
        });
    }
    if (el.profileFollowBtn) {
        el.profileFollowBtn.addEventListener("click", () => {
            if (!S.viewedProfileHash || S.viewedProfileHash === getDeviceId()) return;
            toggleFollowFromDrawer(S.viewedProfileHash);
        });
    }
    if (el.neighborhoodChatBtn) {
        el.neighborhoodChatBtn.addEventListener("click", () => {
            refreshNeighborhoodChatButton();
            el.neighborhoodChatPanel.classList.add("open");
            loadNeighborhoodChat();
        });
    }
    if (el.closeNeighborhoodChatBtn) {
        el.closeNeighborhoodChatBtn.addEventListener("click", closeNeighborhoodChat);
    }
    if (el.closeDirectChatBtn) {
        el.closeDirectChatBtn.addEventListener("click", closeDirectChat);
    }
    if (el.neighborhoodChatForm) {
        el.neighborhoodChatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await sendNeighborhoodChatMessage();
        });
    }
    if (el.neighborhoodChatInput) {
        el.neighborhoodChatInput.addEventListener("input", syncNeighborhoodComposer);
    }
    if (el.directChatForm) {
        el.directChatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await sendDirectChatMessage();
        });
    }
    if (el.directChatPanel) {
        el.directChatPanel.addEventListener("click", (e) => {
            if (e.target === el.directChatPanel) closeDirectChat();
        });
    }
    if (el.neighborhoodChatPanel) {
        el.neighborhoodChatPanel.addEventListener("click", (e) => {
            if (e.target === el.neighborhoodChatPanel) closeNeighborhoodChat();
        });
    }
    if (el.debateSideButtons && el.debateSideButtons.length) {
        el.debateSideButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                el.debateSideButtons.forEach((x) => x.classList.remove("active"));
                btn.classList.add("active");
                if (el.debateSideInput) el.debateSideInput.value = btn.dataset.side || "LEGAL";
            });
        });
    }
    if (el.debateRecordBtn) el.debateRecordBtn.addEventListener("click", toggleDebateRecording);
    if (el.debateTranscribeBtn) el.debateTranscribeBtn.addEventListener("click", tryTranscribeDebate);
    if (el.debateForm) el.debateForm.addEventListener("submit", submitDebateOpinion);
    el.changeProfilePhotoBtn.addEventListener("click", () => el.profilePhotoInput.click());
    el.profilePhotoInput.addEventListener("change", () => {
        const f = el.profilePhotoInput.files && el.profilePhotoInput.files[0] ? el.profilePhotoInput.files[0] : null;
        if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
            el.profileAvatarImg.src = ev.target.result;
            localStorage.setItem("kolona_profile_photo", ev.target.result);
            showToast("Photo de profil mise à jour.");
        };
        r.readAsDataURL(f);
    });

    async function submitSurvey(answer, broadcastId) {
        try {
            const res = await fetch("/api/survey/respond/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") || ""
                },
                body: JSON.stringify({
                    answer: answer,
                    unique_device_id: getDeviceId(),
                    broadcast_id: broadcastId || undefined
                })
            });
            if (!res.ok) throw new Error("survey");
            const payload = await res.json();
            if (broadcastId && S.lastAdminPayload && Number(S.lastAdminPayload.id || 0) === Number(broadcastId)) {
                S.lastAdminPayload.yes_count = Number(payload.yes_count || 0);
                S.lastAdminPayload.no_count = Number(payload.no_count || 0);
                S.lastAdminPayload.total_responses = Number(payload.total || 0);
                renderAdminBroadcastMarker(S.lastAdminPayload);
                if (S.adminBroadcastMarker) S.adminBroadcastMarker.openPopup();
                showToast("Réponse enregistrée pour le sondage admin.");
                return;
            }
            showToast("Merci ! " + payload.yes_percentage + "% des étudiants disent aussi Oui.");
            el.surveyBanner.style.display = "none";
        } catch (_e) {
            showToast("Merci pour votre réponse.");
            if (!broadcastId) el.surveyBanner.style.display = "none";
        }
    }

    el.surveyYesBtn.addEventListener("click", () => submitSurvey("YES"));
    el.surveyNoBtn.addEventListener("click", () => submitSurvey("NO"));

    if (el.knowledgeInstitutionFilter) {
        el.knowledgeInstitutionFilter.addEventListener("change", loadKnowledgeResources);
    }
    if (el.knowledgeCategoryFilter) {
        el.knowledgeCategoryFilter.addEventListener("change", loadKnowledgeResources);
    }
    if (el.knowledgeSearchInput) {
        el.knowledgeSearchInput.addEventListener("input", () => {
            S.knowledgeSearchQuery = el.knowledgeSearchInput.value || "";
            renderKnowledgeSuggestions();
            renderKnowledgeList();
        });
        el.knowledgeSearchInput.addEventListener("focus", renderKnowledgeSuggestions);
    }
    if (el.knowledgeCategoryCards && el.knowledgeCategoryCards.length) {
        el.knowledgeCategoryCards.forEach((btn) => {
            btn.addEventListener("click", () => {
                el.knowledgeCategoryCards.forEach((x) => x.classList.remove("active"));
                btn.classList.add("active");
                launchKnowledgeParticles(btn);
                el.knowledgeCategoryFilter.value = btn.dataset.kcat;
                loadKnowledgeResources();
            });
        });
    }
    document.addEventListener("click", (e) => {
        const suggestionBtn = e.target.closest("[data-knowledge-suggestion]");
        if (suggestionBtn) {
            const resourceId = Number(suggestionBtn.getAttribute("data-knowledge-suggestion") || 0);
            const match = S.knowledgeLibraryAll.find((item) => Number(item.id || 0) === resourceId);
            if (match && el.knowledgeSearchInput) {
                el.knowledgeSearchInput.value = match.title || "";
                S.knowledgeSearchQuery = match.title || "";
                renderKnowledgeSuggestions();
                renderKnowledgeList();
            }
            if (el.knowledgeSearchSuggestions) el.knowledgeSearchSuggestions.classList.remove("show");
            return;
        }
        if (
            el.knowledgeSearchSuggestions
            && !e.target.closest("#knowledge-search-input")
            && !e.target.closest("#knowledge-search-suggestions")
        ) {
            el.knowledgeSearchSuggestions.classList.remove("show");
        }
    });

    if (el.knowledgeForm) {
        el.knowledgeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(el.knowledgeForm);
            fd.set("contributor_hash", getDeviceId());
            const instTag = "#" + String(fd.get("institution") || "").trim();
            const rawTags = String(fd.get("tags") || "").trim();
            if (instTag !== "#" && !rawTags.toUpperCase().includes(instTag.toUpperCase())) {
                fd.set("tags", rawTags ? rawTags + ", " + instTag : instTag);
            }
            if (!el.knowledgeFileInput.files || !el.knowledgeFileInput.files[0]) {
                fd.delete("attachment");
            }

            el.publishKnowledgeBtn.disabled = true;
            el.publishKnowledgeBtn.classList.remove("success");
            el.publishKnowledgeBtn.textContent = "Publication...";
            try {
                const res = await fetch("/api/ressources/", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
                    body: fd
                });
                if (!res.ok) throw new Error("publish");
                showToast("Ressource publiée pour la communauté.");
                loadSelfProfile();
                el.knowledgeForm.reset();
                loadKnowledgeResources();
                loadKnowledgeContributionCount();
                el.publishKnowledgeBtn.classList.add("success");
                el.publishKnowledgeBtn.textContent = "✓ Savoir diffusé !";
                await new Promise((resolve) => window.setTimeout(resolve, 1000));
            } catch (_e) {
                showToast("Publication impossible pour le moment.");
            } finally {
                el.publishKnowledgeBtn.classList.remove("success");
                el.publishKnowledgeBtn.disabled = false;
                el.publishKnowledgeBtn.textContent = "Partager une ressource";
            }
        });
    }

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", async () => {
            try {
                await navigator.serviceWorker.register("/sw.js");
                await setupPushNotifications();
            } catch (_e) {}
        });
        navigator.serviceWorker.addEventListener("message", (event) => {
            const data = event.data || {};
            if (data.type === "ADMIN_BROADCAST") {
                showAdminBanner({
                    message: data.message || "",
                    priority: data.priority || "INFO",
                    id: Number(data.broadcast_id || 0),
                });
            }
        });
    }
    let deferredPrompt = null;

    async function triggerInstallPrompt() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (el.installBtn) el.installBtn.style.display = "none";
            hideInstallGate(false);
            return;
        }
        if (el.iosHint && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
            el.iosHint.style.display = "block";
        }
        showToast("Installation native indisponible ici. Utilise le menu du navigateur pour ajouter SemaChat.");
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event;
        if (el.installBtn) el.installBtn.style.display = "inline-block";
    });
    if (el.installBtn) {
        el.installBtn.addEventListener("click", triggerInstallPrompt);
    }
    if (el.installGateInstallBtn) {
        el.installGateInstallBtn.addEventListener("click", triggerInstallPrompt);
    }
    if (el.installGateContinueBtn) {
        el.installGateContinueBtn.addEventListener("click", () => hideInstallGate(true));
    }
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        if (el.installBtn) el.installBtn.style.display = "none";
        hideInstallGate(true);
    });

    if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone)) {
        el.iosHint.style.display = "block";
    }
    if (!isStandaloneApp()) {
        const installGateSeen = window.localStorage.getItem("semachat_install_gate_seen") === "1";
        if (!installGateSeen) showInstallGate();
    }

    const savedPhoto = localStorage.getItem("kolona_profile_photo");
    if (savedPhoto) el.profileAvatarImg.src = savedPhoto;
    readSocialState();
    readReputationState();
    syncLevelModeButtons();
    const savedDataSaver = localStorage.getItem("kolona_data_saver");
    setDataSaver(savedDataSaver !== "0", false);
    if (el.dataSaverBtn) {
        el.dataSaverBtn.addEventListener("click", () => {
            if (S.dataSaverForced) {
                showToast("Mode verrouillé: réseau lent.");
                return;
            }
            setDataSaver(!S.dataSaverEnabled, true);
        });
    }
    applyNetworkPolicy();
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.addEventListener) {
        conn.addEventListener("change", applyNetworkPolicy);
    }

    syncProfileStats();
    refreshNeighborhoodChatButton();
    connectRealtime();
    consumeSharedFocusFromUrl();
    loadSelfProfile();
    loadServerNotifications(false);
    S.latestMessageSeenAt = new Date().toISOString();
    window.setInterval(() => loadServerNotifications(false), 30000);
    window.setInterval(pollSocialMessages, 10000);
    pollLatestAdminBroadcast();
    pollLatestPollSignalement();
    window.setInterval(pollLatestAdminBroadcast, 45000);
    window.setInterval(pollLatestPollSignalement, 45000);
    loadLeaderboard(20);
    setMediaMode("photo");
    loadSignalements();
    flushQueuedReports();
    window.addEventListener("online", flushQueuedReports);
    window.addEventListener("online", connectRealtime);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") connectRealtime();
    });
    loadKnowledgeContributionCount();
    bootstrapUserGeo();
    loadFeedData();
})();
