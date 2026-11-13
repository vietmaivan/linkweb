document.addEventListener("DOMContentLoaded", () => {
    // Đường dẫn tới tệp JSON chứa dữ liệu
    const DATA_URL = "data.json";

    // Lấy các phần tử DOM cần thiết
    const navList = document.getElementById("nav-list");
    const logoContainer = document.getElementById("logo-container");
    const mobileMenuToggle = document.getElementById("mobile-menu");
    const mainNav = document.getElementById("main-nav");
    const searchInput = document.getElementById("quick-search");
    const searchResults = document.getElementById("search-results");

    let allSearchableItems = [];

    // Tải dữ liệu từ data.json
    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error("Không thể tải file dữ liệu data.json");
            }
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
        .catch(error => {
            console.error("Lỗi khi tải dữ liệu:", error);
        });

    // 1. Hàm render Menu cấp 1, cấp 2, cấp 3
    function renderMenu(menuData, parentElement) {
        parentElement.innerHTML = "";

        menuData.forEach(menuItem => {
            const li = document.createElement("li");
            
            const a = document.createElement("a");
            a.href = menuItem.link || "#";
            a.innerHTML = `${menuItem.title} ${menuItem.submenus ? '<span class="arrow">&#9662;</span>' : ''}`;
            li.appendChild(a);

            if (menuItem.submenus && menuItem.submenus.length > 0) {
                li.classList.add("has-dropdown");
                const ulDropdown = document.createElement("ul");
                ulDropdown.className = "dropdown";

                menuItem.submenus.forEach(submenu => {
                    const subLi = document.createElement("li");
                    const subA = document.createElement("a");
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
                            if (item.title) {
                                itemA.title = item.title;
                            }
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

    // 2. Hàm render Logo truy cập nhanh
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

    // 3. Xây dựng danh mục tìm kiếm nhanh
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

    // 4. Xử lý các hiệu ứng tương tác (Hover, Click Mobile, Search)
    function initInteractions() {
        // Toggle menu mobile
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener("click", () => {
                mainNav.classList.toggle("active");
                mobileMenuToggle.classList.toggle("open");
            });
        }

        // Xử lý sự kiện click trên menu cấp 1/2 cho thiết bị cảm ứng / mobile
        const navItems = navList.querySelectorAll("li");
        navItems.forEach(li => {
            const link = li.querySelector("a");
            link.addEventListener("click", (e) => {
                const dropdown = li.querySelector(".dropdown, .submenu");
                if (dropdown) {
                    // Nếu trên màn hình nhỏ hoặc click để mở
                    if (window.innerWidth <= 992 || li.classList.contains("has-dropdown") || li.classList.contains("has-submenu")) {
                        e.preventDefault();
                        // Đóng các mục ngang hàng khác
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
                }
            });
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

            // Ẩn kết quả tìm kiếm khi click ra ngoài
            document.addEventListener("click", (e) => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.classList.remove("active");
                }
            });
        }
    }
});