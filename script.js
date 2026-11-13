document.addEventListener("DOMContentLoaded", () => {
    const DATA_URL = "data.json";

    const navList = document.getElementById("nav-list");
    const logoContainer = document.getElementById("logo-container");
    const mobileMenuToggle = document.getElementById("mobile-menu");
    const mainNav = document.getElementById("main-nav");
    const searchInput = document.getElementById("quick-search");
    const searchResults = document.getElementById("search-results");

    let allSearchableItems = [];

    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) throw new Error("Không thể tải file dữ liệu data.json");
            return response.json();
        })
        .then(data => {
            if (data.menu) {
                renderMenu(data.menu, navList);
                buildSearchIndex(data.menu);
            }
            if (data.logos) {
                renderLogos(data.logos, logoContainer);
            }
            initInteractions();
        })
        .catch(error => console.error("Lỗi khi tải dữ liệu:", error));

    // 1. Render Menu đa cấp
    function renderMenu(menuData, parentElement) {
        parentElement.innerHTML = "";

        menuData.forEach(menuItem => {
            const li = document.createElement("li");
            li.className = "has-dropdown";
            const a = document.createElement("a");
            a.href = menuItem.link || "#";
            a.innerHTML = `${menuItem.title} ${menuItem.submenus ? '<span class="arrow">&#9662;</span>' : ''}`;
            li.appendChild(a);

            if (menuItem.submenus && menuItem.submenus.length > 0) {
                const ulDropdown = document.createElement("ul");
                ulDropdown.className = "dropdown";

                menuItem.submenus.forEach(submenu => {
                    const subLi = document.createElement("li");
                    const subA = document.createElement("a");
                    subA.href = "#";
                    subA.innerHTML = `${submenu.title} ${submenu.items ? '<span class="arrow">&#9656;</span>' : ''}`;
                    subLi.appendChild(subA);

                    if (submenu.items && submenu.items.length > 0) {
                        subLi.classList.add("has-submenu");
                        const ulSubmenu = document.createElement("ul");
                        ulSubmenu.className = "submenu";

                        submenu.items.forEach(item => {
                            const itemLi = document.createElement("li");
                            const itemA = document.createElement("a");
                            itemA.href = item.link;
                            itemA.textContent = item.name;
                            itemA.target = "_blank";
                            if (item.title) itemA.title = item.title;
                            itemLi.appendChild(itemA);
                            ulSubmenu.appendChild(itemLi);
                        });

                        subLi.appendChild(ulSubmenu);
                    }
                    ulDropdown.appendChild(subLi);
                });
                li.appendChild(ulDropdown);
            }
            parentElement.appendChild(li);
        });
    }

    // 2. Render Logo
    function renderLogos(logosData, parentElement) {
        parentElement.innerHTML = "";
        logosData.forEach(logo => {
            const a = document.createElement("a");
            a.href = logo.link;
            a.target = "_blank";
            a.title = logo.name;

            const img = document.createElement("img");
            img.src = logo.image;
            img.alt = logo.name;

            a.appendChild(img);
            parentElement.appendChild(a);
        });
    }

    // 3. Tạo chỉ mục tìm kiếm
    function buildSearchIndex(menuData) {
        allSearchableItems = [];
        menuData.forEach(menu => {
            if (menu.submenus) {
                menu.submenus.forEach(sub => {
                    if (sub.items) {
                        sub.items.forEach(item => {
                            allSearchableItems.push({
                                name: item.name,
                                link: item.link,
                                title: item.title || "",
                                category: `${menu.title} > ${sub.title}`
                            });
                        });
                    }
                });
            }
        });
    }

    // 4. Hàm kiểm tra và tự động lật menu cấp 2 & cấp 3 khi tràn màn hình
    function checkOverflow(li) {
        if (window.innerWidth <= 992) return; // Bỏ qua trên mobile

        // Kiểm tra menu cấp 2
        const dropdown = li.querySelector(":scope > .dropdown");
        if (dropdown) {
            dropdown.classList.remove("align-left");
            const rect = dropdown.getBoundingClientRect();
            if (rect.right > window.innerWidth - 15) {
                dropdown.classList.add("align-left");
            }
        }

        // Kiểm tra menu cấp 3 (Submenu)
        const submenu = li.querySelector(":scope > .submenu");
        if (submenu) {
            submenu.classList.remove("align-left");
            li.classList.remove("flip-arrow");
            const rectSub = submenu.getBoundingClientRect();
            if (rectSub.right > window.innerWidth - 15) {
                submenu.classList.add("align-left");
                li.classList.add("flip-arrow");
            }
        }
    }

    // 5. Khởi tạo các tương tác
    function initInteractions() {
        // Toggle menu mobile
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener("click", () => {
                mainNav.classList.toggle("active");
                mobileMenuToggle.classList.toggle("open");
            });
        }

        const allLiItems = navList.querySelectorAll("li");
        allLiItems.forEach(li => {
            // Rê chuột vào (Desktop): Tự động tính toán chống tràn màn hình mượt mà
            li.addEventListener("mouseenter", () => {
                checkOverflow(li);
            });

            // Click/Chạm: Dành cho Mobile hoặc khi bấm trực tiếp vào mục cha
            const link = li.querySelector(":scope > a");
            if (link) {
                link.addEventListener("click", (e) => {
                    const dropdown = li.querySelector(":scope > .dropdown, :scope > .submenu");
                    if (dropdown && window.innerWidth <= 992) {
                        e.preventDefault();
                        const siblings = li.parentElement.children;
                        for (let sib of siblings) {
                            if (sib !== li) {
                                sib.classList.remove("open");
                                const sub = sib.querySelector(".dropdown, .submenu");
                                if (sub) sub.classList.remove("show");
                            }
                        }
                        li.classList.toggle("open");
                        dropdown.classList.toggle("show");
                    }
                });
            }
        });

        // Tìm kiếm nhanh
        if (searchInput && searchResults) {
            searchInput.addEventListener("input", (e) => {
                const keyword = e.target.value.toLowerCase().trim();
                if (keyword === "") {
                    searchResults.innerHTML = "";
                    searchResults.classList.remove("active");
                    return;
                }

                const filtered = allSearchableItems.filter(item =>
                    item.name.toLowerCase().includes(keyword) ||
                    item.title.toLowerCase().includes(keyword) ||
                    item.category.toLowerCase().includes(keyword)
                );

                if (filtered.length > 0) {
                    let html = "";
                    filtered.slice(0, 15).forEach(item => {
                        html += `
                            <a href="${item.link}" target="_blank" class="search-item">
                                <div>
                                    <strong>${item.name}</strong>
                                    <div style="font-size: 12px; color: #64748b;">${item.title}</div>
                                </div>
                                <span class="search-item-cat">${item.category}</span>
                            </a>
                        `;
                    });
                    searchResults.innerHTML = html;
                    searchResults.classList.add("active");
                } else {
                    searchResults.innerHTML = `<div style="padding: 15px; text-align: center; color: #64748b;">Không tìm thấy liên kết phù hợp</div>`;
                    searchResults.classList.add("active");
                }
            });

            document.addEventListener("click", (e) => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.classList.remove("active");
                }
            });
        }
    }
});