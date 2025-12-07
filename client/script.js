// 商品卡片组件
class ProductCard {
    constructor(product, options = {}) {
        this.product = product;
        this.options = {
            showActions: false,
            onEdit: null,
            onDelete: null,
            className: 'product-card',
            ...options
        };
        this.element = null;
        this.createCard();
    }
    
    // 创建卡片DOM元素
    createCard() {
        this.element = document.createElement('div');
        this.element.className = this.options.className;
        this.element.dataset.productId = this.product.id;
        
        this.render();
        this.bindEvents();
    }
    
    // 渲染卡片内容
    render() {
        const { product, options } = this;

        const actionsHtml = options.showActions ? `
            <div class="product-actions">
                <button class="action-btn edit-btn" data-action="edit">编辑</button>
                <button class="action-btn delete-btn" data-action="delete">删除</button>
                <button class="action-btn hot-btn ${product.is_hot ? 'active' : ''}" data-action="toggle-hot" title="${product.is_hot ? '取消爆款' : '设为爆款'}">
                    ${product.is_hot ? '🔥' : '⭐'}
                </button>
            </div>
        ` : '';

        const outOfStock = product.stock <= 0;
        const stockClass = outOfStock ? 'out-of-stock' : '';
        const stockText = outOfStock ? '缺货' : `库存：${product.stock} 件`;
        const clickHint = !options.showActions && !outOfStock ? '<div class="click-hint">点击购买</div>' : '';

        // 判断是否为管理界面
        const isManagementMode = options.showActions;

        // 管理界面中的热门商品标识
        const managementHotBadge = isManagementMode ?
            `<div class="management-hot-indicator ${product.is_hot ? 'active' : ''}" title="${product.is_hot ? '热门商品' : '普通商品'}">
                ${product.is_hot ? '⭐' : '☆'}
            </div>` : '';

        // 普通界面的爆款标签和动画（管理界面不显示）
        const hotBadgeHtml = !isManagementMode && product.is_hot ? `
            <div class="hot-badge">
                ${product.hot_badge_text || '🔥爆款'}
            </div>
        ` : '';

        const fireAnimation = !isManagementMode && product.is_hot ?
            '<div class="fire-animation">🔥</div>' : '';

        this.element.innerHTML = `
            ${hotBadgeHtml}
            ${managementHotBadge}
            ${actionsHtml}
            <div class="product-image ${stockClass}">
                ${product.image_url || '🍋'}
                ${outOfStock ? '<div class="sold-out-overlay">缺货</div>' : ''}
                ${fireAnimation}
            </div>
            <div class="product-info">
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-description">${this.escapeHtml(product.description || '')}</div>
                ${product.discount_price ? `
                    <div class="product-price-container">
                        <div class="product-original-price">¥${product.price}</div>
                        <div class="product-price discount-price">¥${product.discount_price}</div>
                        ${product.discount_percentage ? `
                            <span class="discount-badge">${product.discount_percentage}% OFF</span>
                        ` : ''}
                    </div>
                ` : `
                    <div class="product-price">¥${product.price}</div>
                `}
                <div class="product-stock ${stockClass}">${stockText}</div>
                <div class="product-category">${this.escapeHtml(product.category)}</div>
                ${clickHint}
            </div>
        `;

        // 管理界面中热门商品不使用特殊样式
        if (!isManagementMode && product.is_hot) {
            this.element.classList.add('hot-product');
        } else {
            this.element.classList.remove('hot-product');
        }

        // 为缺货商品添加样式
        if (outOfStock) {
            this.element.classList.add('product-out-of-stock');
        } else {
            this.element.classList.remove('product-out-of-stock');
        }
    }
    
    // 绑定事件
    bindEvents() {
        if (this.options.showActions) {
            // 管理员模式：编辑和删除按钮
            this.element.addEventListener('click', (e) => {
                const action = e.target.dataset.action;

                // 点击星星标识也能切换热门状态
                if (e.target.classList.contains('management-hot-indicator') && this.options.onToggleHot) {
                    e.stopPropagation();
                    this.options.onToggleHot(this.product.id, !this.product.is_hot);
                    return;
                }

                if (action === 'edit' && this.options.onEdit) {
                    e.stopPropagation();
                    this.options.onEdit(this.product.id);
                } else if (action === 'delete' && this.options.onDelete) {
                    e.stopPropagation();
                    this.options.onDelete(this.product.id);
                } else if (action === 'toggle-hot' && this.options.onToggleHot) {
                    e.stopPropagation();
                    this.options.onToggleHot(this.product.id, !this.product.is_hot);
                }
            });
        } else {
            // 普通模式：点击购买
            this.element.addEventListener('click', (e) => {
                console.log('Product card clicked:', this.product.name, 'ID:', this.product.id);

                // 检查库存
                if (this.product.stock <= 0) {
                    console.log('Product out of stock');
                    if (this.options.onOutOfStock) {
                        this.options.onOutOfStock(this.product.id);
                    }
                    return;
                }

                // 触发购买事件
                console.log('Triggering purchase event');
                if (this.options.onPurchase) {
                    this.options.onPurchase(this.product.id);
                } else {
                    console.log('No onPurchase callback found!');
                }
            });
            
            // 添加悬停效果
            this.element.style.cursor = 'pointer';
            this.element.addEventListener('mouseenter', () => {
                if (this.product.stock > 0) {
                    this.element.style.transform = 'translateY(-2px)';
                    this.element.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }
            });
            
            this.element.addEventListener('mouseleave', () => {
                this.element.style.transform = 'translateY(0)';
                this.element.style.boxShadow = '';
            });
        }
    }
    
    // 更新产品数据
    updateProduct(newProduct) {
        this.product = { ...this.product, ...newProduct };
        this.render();
    }
    
    // 获取DOM元素
    getElement() {
        return this.element;
    }
    
    // 销毁组件
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
    
    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 侧边栏组件
class SidebarComponent {
    constructor(app) {
        this.app = app; // 主应用实例的引用
        this.isOpen = false;
        this.eventsInitialized = false;
        this.handleToggleClick = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 防止重复绑定
        if (this.eventsInitialized) {
            console.log('Events already initialized, skipping...');
            return;
        }

        console.log('Initializing sidebar events...');

        // 侧边栏控制事件 - 绑定所有页面的汉堡菜单按钮
        const toggleButtons = document.querySelectorAll('.sidebar-toggle');
        const closeBtn = document.getElementById('sidebar-close');
        const overlay = document.getElementById('sidebar-overlay');
        const avatar = document.getElementById('navbar-avatar');
        const purchaseAvatar = document.getElementById('purchase-navbar-avatar');

        console.log('Found toggle buttons:', toggleButtons.length);

        // 为所有汉堡菜单按钮绑定事件
        toggleButtons.forEach((toggleBtn, index) => {
            if (toggleBtn) {
                console.log(`Binding event to toggle button ${index}:`, toggleBtn);
                // 移除可能存在的旧事件监听器
                toggleBtn.removeEventListener('click', this.handleToggleClick);

                // 创建绑定的事件处理函数
                this.handleToggleClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Toggle button clicked:', index, toggleBtn);
                    this.toggle();
                };

                toggleBtn.addEventListener('click', this.handleToggleClick);
            }
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                this.close();
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                console.log('Overlay clicked');
                this.close();
            });
        }
        
        if (avatar) {
            avatar.addEventListener('click', () => {
                console.log('Main avatar clicked');
                this.toggle();
            });
        }

        if (purchaseAvatar) {
            purchaseAvatar.addEventListener('click', () => {
                console.log('Purchase page avatar clicked');
                this.toggle();
            });
        }
        
        // 导航菜单事件
        document.getElementById('nav-shop').addEventListener('click', (e) => this.handleNavigation(e, 'shop'));
        document.getElementById('nav-profile').addEventListener('click', (e) => this.handleNavigation(e, 'profile'));
        
        // 管理员菜单事件（如果存在）
        const navProducts = document.getElementById('nav-products');
        const navLogout = document.getElementById('nav-logout');

        if (navProducts) {
            navProducts.addEventListener('click', (e) => this.handleNavigation(e, 'products'));
        }
        // navUsers 已被移除，不再需要
        if (navLogout) {
            navLogout.addEventListener('click', (e) => {
                console.log('🚪 nav-logout 按钮被点击');
                console.log('🔗 this.app 存在:', !!this.app);
                console.log('🔗 this.app.handleLogout 存在:', !!(this.app && this.app.handleLogout));
                e.preventDefault();
                if (this.app && this.app.handleLogout) {
                    this.app.handleLogout();
                } else {
                    console.error('❌ handleLogout 方法不可用');
                    alert('退出登录功能暂时不可用，请刷新页面重试');
                }
            });
            console.log('✅ nav-logout 事件绑定成功');
        } else {
            console.log('❌ nav-logout 按钮未找到');
        }

        // 标记事件已初始化
        this.eventsInitialized = true;
        console.log('Sidebar events initialized successfully');
    }

    toggle() {
        console.log('Sidebar toggle called, current state:', this.isOpen);
        console.log('Sidebar element:', document.getElementById('sidebar'));
        console.log('Overlay element:', document.getElementById('sidebar-overlay'));

        if (this.isOpen) {
            console.log('Closing sidebar...');
            this.close();
        } else {
            console.log('Opening sidebar...');
            this.open();
        }
    }

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        sidebar.classList.add('active');
        overlay.classList.add('active');

        // 为所有汉堡菜单按钮添加 active 状态
        const toggleButtons = document.querySelectorAll('.sidebar-toggle');
        toggleButtons.forEach(toggle => {
            if (toggle) toggle.classList.add('active');
        });

        this.isOpen = true;

        // 防止背景滚动
        document.body.classList.add('sidebar-open');
    }

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        sidebar.classList.remove('active');
        overlay.classList.remove('active');

        // 为所有汉堡菜单按钮移除 active 状态
        const toggleButtons = document.querySelectorAll('.sidebar-toggle');
        toggleButtons.forEach(toggle => {
            if (toggle) toggle.classList.remove('active');
        });

        this.isOpen = false;

        // 恢复背景滚动
        document.body.classList.remove('sidebar-open');
    }

    handleNavigation(e, page) {
        e.preventDefault();
        
        // 防止重复导航
        const now = Date.now();
        if (now - (this.lastNavigationTime || 0) < 300) {
            return;
        }
        this.lastNavigationTime = now;

        this.updateNavigation(page);
        this.app.showContentPage(page);
        this.close();
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        const activeNav = document.getElementById(`nav-${activePage}`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    updateUserInfo(userProfile) {
        document.getElementById('sidebar-username').textContent = userProfile.username || '用户';
        document.getElementById('sidebar-email').textContent = userProfile.email || '';
        document.getElementById('sidebar-avatar').textContent = userProfile.avatar || '👤';

        // 更新用户角色并显示相应的菜单
        this.updateManagerMenus(userProfile.role);

        // 更新退出登录按钮的显示状态
        this.updateLogoutButtonVisibility(userProfile);
    }

    updateManagerMenus(userRole) {
        console.log('🔧 更新管理员菜单显示...');
        const managerItems = document.querySelectorAll('.manager-only');
        console.log('🔧 找到管理员菜单元素数量:', managerItems.length);

        managerItems.forEach((item, index) => {
            console.log(`🔧 处理菜单项 ${index}:`, item.textContent || item.id);
            if (userRole === 'manager') {
                item.style.display = 'block';
                item.classList.add('show');
                console.log(`✅ 显示菜单项 ${index}`);
            } else {
                item.style.display = 'none';
                item.classList.remove('show');
                console.log(`❌ 隐藏菜单项 ${index}`);
            }
        });

        console.log('🔧 侧边栏角色检查:', userRole, '管理员菜单数量:', managerItems.length);
    }

    updateLogoutButtonVisibility(userProfile) {
        const logoutBtn = document.getElementById('nav-logout');
        if (logoutBtn) {
            // 如果用户已登录（有token），显示退出登录按钮
            const token = localStorage.getItem('authToken');
            if (token && userProfile.email && userProfile.email !== 'guest@shop.com') {
                logoutBtn.style.display = 'block';
            } else {
                logoutBtn.style.display = 'none';
            }
        }
    }
}

class ShopSystem {
    constructor() {
        console.log('🚀 ShopSystem 正在初始化...');
        this.products = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.userRole = 'user';
        this.editingProductId = null;
        this.currentContentPage = 'shop';
        this.notificationInterval = null;
        this.orders = this.loadOrders(); // 加载本地订单

        // 导航历史管理
        this.navigationHistory = ['shop']; // 默认从商店页面开始
        this.currentHistoryIndex = 0;
        
        // 从本地存储加载用户信息，如果没有则使用默认值
        this.userProfile = this.loadUserProfile() || {
            username: '访客',
            email: 'guest@shop.com',
            avatar: '👤',
            role: 'user'
        };

        console.log('🔍 ===== 用户角色检测开始 =====');
        console.log('🔍 初始用户信息:', this.userProfile);
        console.log('🔍 用户邮箱:', this.userProfile.email);
        console.log('🔍 初始角色:', this.userProfile.role);

        // 强制检测：任何情况下都确保正确的角色设置
        let roleChanged = false;

        // 统一角色识别：将"店长"转换为"manager"
        if (this.userProfile.role === '店长') {
            console.log('✅ 检测到角色为"店长"，转换为manager');
            this.userProfile.role = 'manager';
            roleChanged = true;
        }

        // 如果邮箱包含"jing"，自动设置为店长
        if (this.userProfile.email && this.userProfile.email.toLowerCase().includes('jing')) {
            console.log('✅ 检测到店长邮箱，自动设置为manager角色');
            this.userProfile.role = 'manager';
            roleChanged = true;
        }

        // 强制检查：如果用户名是Jing，也设为店长
        if (this.userProfile.username && this.userProfile.username.toLowerCase() === 'jing') {
            console.log('✅ 检测到店长用户名，自动设置为manager角色');
            this.userProfile.role = 'manager';
            roleChanged = true;
        }

        if (roleChanged) {
            this.saveUserProfile(); // 保存更新后的角色
            console.log('💾 角色已更新并保存');
        }

        console.log('📋 最终用户角色:', this.userProfile.role);
        console.log('🔍 ===== 用户角色检测完成 =====');

        // 加载或生成认证token
        this.token = localStorage.getItem('authToken') || null;

        // 如果是店长但没有token，生成一个默认token
        if (this.userProfile.role === 'manager' && !this.token) {
            const managerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImppbmcxOTc1MTAxM0BpY2xvdWQuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJpYXQiOjE3NTU0MjcwNjR9.ilcF0ZDplRd0-UYFj9yilINQf-_7WUL5_Gp5LdVWMhQ';
            localStorage.setItem('authToken', managerToken);
            this.token = managerToken;
            console.log('为店长用户生成默认token');
        }

        // 添加状态管理
        this.isLoadingProducts = false;
        this.isProductsLoaded = false;
        this.isEventsInitialized = false;
        this.lastNavigationTime = 0;
        
        // 创建侧边栏组件
        this.sidebar = new SidebarComponent(this);
        
        // 商品卡片管理器
        this.productCards = new Map(); // 存储商品卡片实例
        
        // 食物表情包数据库
        this.foodEmojis = {
            '水果类': ['🍋', '🍎', '🍊', '🍌', '🍇', '🥝', '🍓', '🥭', '🍑', '🍒', '🥥', '🍍', '🫐', '🍈', '🍉'],
            '蔬菜类': ['🥕', '🌽', '🥒', '🥬', '🥦', '🍅', '🥔', '🧄', '🧅', '🍆', '🌶️', '🫑', '🥗', '🌰', '🫛'],
            '饮品类': ['🥛', '🍼', '☕', '🫖', '🥤', '🧃', '🍷', '🍾', '🍶', '🥃', '🍹', '🍸', '🧋', '🍺', '🍻'],
            '主食类': ['🍞', '🥖', '🥨', '🥞', '🧇', '🍚', '🍜', '🍝', '🥘', '🍲', '🍛', '🥙', '🌯', '🫓', '🍕'],
            '甜品类': ['🍰', '🎂', '🧁', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🥧', '🍩', '🧈', '🍦', '🍨', '🧊'],
            '快餐类': ['🍔', '🌭', '🍕', '🌮', '🌯', '🥙', '🥪', '🍟', '🥓', '🥚', '🍳', '🧀', '🥩', '🍗', '🦴'],
            '特色食材': ['🍯', '🧈', '🧂', '🥜', '🌰', '🫘', '🥥', '🫒', '🧄', '🧅', '🌿', '🫚', '🥄', '🍴', '🥢']
        };
        
        // init() 将在DOMContentLoaded事件中异步调用
    }
    
    // 销毁应用时清理所有组件
    destroy() {
        // 清理所有商品卡片
        this.clearProductCards('shop');
        this.clearProductCards('manager');
        
        // 清理侧边栏组件
        if (this.sidebar) {
            this.sidebar = null;
        }
    }

    async init() {
        this.bindEvents();
        this.initNotificationSystem();

        // 检查已存储的认证令牌（但不阻塞页面加载）
        this.checkStoredAuthToken().catch(error => {
            console.error('检查认证令牌失败:', error);
        });

        // 设置用户角色以便正确显示管理员菜单
        this.userRole = this.userProfile.role || 'user';

        // 如果用户是店长，确保显示所有管理功能
        if (this.userRole === 'manager') {
            console.log('🚀 初始化店长功能...');
            this.forceEnableManagerPermissions();
        }
        // 直接加载商店页面
        this.loadShopPage();
        this.showContentPage('shop');
    }

    // 强制启用管理员权限
    forceEnableManagerPermissions() {
        console.log('🔒 ===== 强制启用管理员权限 =====');

        // 1. 显示所有管理员菜单
        const managerItems = document.querySelectorAll('.manager-only');
        console.log('🔒 找到管理员元素数量:', managerItems.length);

        managerItems.forEach((el, index) => {
            el.style.display = 'block';
            el.classList.add('show');
            console.log(`🔒 启用管理员元素 ${index}:`, el.textContent || el.id || el.className);
        });

        // 2. 更新侧边栏
        if (this.sidebar) {
            console.log('🔒 更新侧边栏管理员菜单');
            this.sidebar.updateManagerMenus('manager');
        }

        // 3. 确保用户角色变量正确
        this.userRole = 'manager';
        console.log('🔒 用户角色已设置为:', this.userRole);

        // 4. 强制显示商品管理菜单项
        const navProducts = document.getElementById('nav-products');
        if (navProducts) {
            navProducts.style.display = 'block';
            console.log('🔒 商品管理菜单已强制显示');
        }

        console.log('🔒 ===== 管理员权限启用完成 =====');
    }

    bindEvents() {
        // 侧边栏事件由 SidebarComponent 处理，这里只处理其他事件
        
        // 个人设置事件
        document.getElementById('change-avatar-btn').addEventListener('click', () => this.showAvatarModal());
        document.getElementById('close-avatar-modal').addEventListener('click', () => this.hideAvatarModal());
        document.getElementById('profile-form').addEventListener('submit', (e) => this.handleProfileSave(e));
        document.getElementById('upgrade-form').addEventListener('submit', (e) => this.handleUpgradeToManager(e));
        
        // 退出登录按钮事件（使用事件委托）
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'logout-btn') {
                console.log('退出登录按钮被点击');
                this.handleLogout();
            }
        });

        // 返回商店按钮事件（使用事件委托）
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('back-to-shop-btn')) {
                console.log('返回商店按钮被点击');
                e.preventDefault();
                this.showContentPage('shop');
            }

            // 返回上一页按钮事件
            if (e.target && (e.target.classList.contains('back-btn') || e.target.classList.contains('btn-back'))) {
                console.log('返回上一页按钮被点击');
                e.preventDefault();
                this.goBack();
            }
        });

        
        // 也尝试直接绑定（如果元素存在）
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
            console.log('退出登录按钮事件绑定成功');
        } else {
            console.warn('退出登录按钮未找到，将使用事件委托');
        }
        
        // 头像选择事件
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectAvatar(e.target.dataset.avatar));
        });
        
        // ESC键关闭侧边栏和模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.sidebar.close();
                this.hideProductModal();
                this.hideAvatarModal();
            }
        });
        
        // 商品管理事件
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showProductModal());
        }

        // 批量上传按钮事件
        const batchUploadBtn = document.getElementById('batch-upload-btn');
        if (batchUploadBtn) {
            batchUploadBtn.addEventListener('click', () => this.handleBatchUpload());
        }
        
        // 商品模态框事件
        const closeModalBtn = document.getElementById('close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideProductModal());
        }
        
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideProductModal());
        }
        
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleProductSave(e));
        }

        // 爆款商品复选框事件
        const hotCheckbox = document.getElementById('product-is-hot');
        if (hotCheckbox) {
            hotCheckbox.addEventListener('change', (e) => {
                const hotPriorityGroup = document.getElementById('hot-priority-group');
                if (hotPriorityGroup) {
                    hotPriorityGroup.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }

        // 折扣价格输入事件
        const discountPriceInput = document.getElementById('product-discount-price');
        const priceInput = document.getElementById('product-price');
        if (discountPriceInput && priceInput) {
            const updateDiscountPreview = () => {
                const price = parseFloat(priceInput.value);
                const discountPrice = parseFloat(discountPriceInput.value);
                const discountPreview = document.getElementById('discount-preview');
                const discountPercentage = document.getElementById('discount-percentage');

                if (price && discountPrice && discountPrice < price) {
                    const percentage = Math.round((1 - discountPrice / price) * 100);
                    discountPercentage.textContent = percentage;
                    discountPreview.style.display = 'block';
                } else {
                    discountPreview.style.display = 'none';
                }
            };

            discountPriceInput.addEventListener('input', updateDiscountPreview);
            priceInput.addEventListener('input', updateDiscountPreview);
        }

        // 表情包选择器事件
        this.initEmojiPicker();

        // 购买相关事件
        this.initPurchaseEvents();

        // 键盘快捷键事件
        this.initKeyboardShortcuts();
        
        // 定制弹窗事件
        this.initCustomizationEvents();

        // 批量编辑弹窗事件
        this.initBatchEditEvents();
        
        // 分类管理事件
        this.initCategoryManagementEvents();
    }

    loadShopPage() {
        // 汉堡菜单按钮现在在导航栏中，始终可见
        this.sidebar.updateUserInfo(this.userProfile);
        this.updateNavbarUserInfo();
        this.loadProducts();
    }

    updateNavbarUserInfo() {
        const navbarAvatar = document.getElementById('navbar-avatar');
        if (navbarAvatar) {
            navbarAvatar.textContent = this.userProfile.avatar;
        }
    }

    // 页面切换
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        this.currentPage = pageId.replace('-page', '');
    }

    showLoginPage() {
        this.showPage('login-page');
        document.getElementById('email-input').value = this.currentEmail;
        this.clearErrors();
    }

    async showVerificationPage() {
        this.showPage('verification-page');
        document.getElementById('sent-email').textContent = this.currentEmail;
        document.getElementById('code-input').value = '';
        document.getElementById('code-input').focus();
        
        // 检查用户是否需要设置密码
        try {
            const userResponse = await fetch(`/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token || ''}`
                }
            });
            
            const userData = await userResponse.json();
            const isNewUser = !userResponse.ok;
            
            if (isNewUser) {
                // 新用户，显示密码设置
                document.getElementById('password-setup-group').style.display = 'block';
                document.getElementById('verification-title').textContent = '注册账户';
                document.getElementById('verify-btn-text').textContent = '注册并登录';
                document.getElementById('setup-password-input').required = true;
            } else {
                // 现有用户，检查是否有密码
                const hasPasswordResponse = await fetch('/api/auth/has-password', {
                    headers: {
                        'Authorization': `Bearer ${this.token || ''}`
                    }
                });
                
                if (hasPasswordResponse.ok) {
                    const hasPasswordData = await hasPasswordResponse.json();
                    if (!hasPasswordData.hasPassword) {
                        // 现有用户但没有密码，可选择设置
                        document.getElementById('password-setup-group').style.display = 'block';
                        document.getElementById('verification-title').textContent = '设置密码';
                        document.getElementById('verify-btn-text').textContent = '登录';
                        document.querySelector('#password-setup-group .info-text').textContent = '建议设置密码，方便下次快速登录（可选）';
                    }
                }
            }
        } catch (error) {
            // 忽略错误，按默认方式处理
            console.log('检查用户状态失败，按新用户处理');
            document.getElementById('password-setup-group').style.display = 'block';
            document.getElementById('verification-title').textContent = '注册账户';
            document.getElementById('verify-btn-text').textContent = '注册并登录';
            document.getElementById('setup-password-input').required = true;
        }
        
        this.startCountdown();
        this.clearErrors();
    }

    showMainInterface() {
        // 隐藏认证容器，显示主界面
        document.getElementById('auth-container').style.display = 'none';
        // 显示汉堡菜单按钮
        document.getElementById('sidebar-toggle').classList.add('show');
        this.showContentPage('shop');
        // 更新侧边栏用户信息（包括退出登录按钮）
        this.updateSidebarUserInfo();
        // 从服务器刷新用户资料以确保角色正确
        this.refreshUserProfile();
    }

    showContentPage(pageName, addToHistory = true) {
        console.log('showContentPage called with:', pageName, 'current page:', this.currentContentPage);

        // 如果已经在当前页面，只关闭侧边栏
        if (this.currentContentPage === pageName) {
            console.log('Already on page', pageName, 'closing sidebar');
            this.sidebar.close();
            return;
        }

        // 添加到导航历史（如果启用历史跟踪）
        if (addToHistory && this.currentContentPage !== pageName) {
            this.addToNavigationHistory(pageName);
        }

        // 隐藏所有内容页面
        document.querySelectorAll('.content-page').forEach(page => {
            page.style.display = 'none';
        });

        // 显示指定页面
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            targetPage.classList.add('active');
            console.log('Successfully switched to page:', pageName);
        } else {
            console.error('Target page not found:', `${pageName}-page`);
            return;
        }

        this.currentContentPage = pageName;
        this.updateNavigation(pageName);
        this.updateBackButton();
        this.sidebar.close();
        
        // 根据页面类型加载相应数据（只在必要时）
        switch(pageName) {
            case 'shop':
                // 只在首次访问或需要刷新时加载
                if (!this.isProductsLoaded) {
                    this.loadProducts();
                } else {
                    // 如果数据已加载，只渲染现有数据
                    this.renderProducts();
                }
                break;
            case 'products':
                this.loadManagerProducts();
                break;
            case 'profile':
                this.loadProfileData();
                break;
        }

        // 侧边栏事件已在初始化时绑定，无需重复绑定
    }

    // 添加到导航历史
    addToNavigationHistory(pageName) {
        // 移除当前位置之后的所有历史记录
        this.navigationHistory = this.navigationHistory.slice(0, this.currentHistoryIndex + 1);

        // 添加新页面到历史
        this.navigationHistory.push(pageName);
        this.currentHistoryIndex = this.navigationHistory.length - 1;

        console.log('📈 导航历史更新:', this.navigationHistory, '当前索引:', this.currentHistoryIndex);
    }

    // 返回上一页
    goBack() {
        if (this.canGoBack()) {
            this.currentHistoryIndex--;
            const previousPage = this.navigationHistory[this.currentHistoryIndex];
            console.log('⬅️ 返回上一页:', previousPage);
            this.showContentPage(previousPage, false); // 不添加到历史
        } else {
            console.log('❌ 无法返回，已在第一页');
            this.showToast('已经是第一页了', 'info');
        }
    }

    // 检查是否可以返回
    canGoBack() {
        return this.currentHistoryIndex > 0;
    }

    // 更新返回按钮状态
    updateBackButton() {
        const backButtons = document.querySelectorAll('.back-btn, .btn-back');
        const canBack = this.canGoBack();

        backButtons.forEach(btn => {
            if (btn) {
                btn.disabled = !canBack;
                btn.style.opacity = canBack ? '1' : '0.5';
                btn.style.cursor = canBack ? 'pointer' : 'not-allowed';
            }
        });
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        const activeNav = document.getElementById(`nav-${activePage}`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    updateSidebarUserInfo() {
        // 使用侧边栏组件更新用户信息
        this.sidebar.updateUserInfo(this.userProfile);
    }

    async refreshUserProfile() {
        try {
            const response = await fetch('/api/products/user/role', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // 完全重置用户资料以避免跨账号数据污染
                this.userProfile = {
                    username: '用户',
                    email: this.currentEmail,
                    avatar: '👤',
                    role: data.role
                };
                this.userRole = data.role;
                
                // 保存到本地存储
                this.saveUserProfile();
                
                // 更新UI
                this.updateSidebarUserInfo();
                this.updateManagerMenus(data.role);
                
                // 重启通知轮询
                this.stopNotificationPolling();
                this.startNotificationPolling();
                
                console.log('用户资料已刷新, 邮箱:', this.currentEmail, '角色:', data.role);
            }
        } catch (error) {
            console.error('刷新用户资料失败:', error);
        }
    }

    // 登录模式切换
    switchLoginMode(mode) {
        const passwordForm = document.getElementById('password-login-form');
        const codeForm = document.getElementById('code-login-form');
        const passwordBtn = document.getElementById('password-login-btn');
        const codeBtn = document.getElementById('code-login-btn');
        
        if (mode === 'password') {
            passwordForm.style.display = 'block';
            codeForm.style.display = 'none';
            passwordBtn.classList.add('active');
            codeBtn.classList.remove('active');
        } else {
            passwordForm.style.display = 'none';
            codeForm.style.display = 'block';
            passwordBtn.classList.remove('active');
            codeBtn.classList.add('active');
        }
        
        this.clearErrors();
    }


    // 密码登录
    async handlePasswordLogin(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('password-email-input');
        const passwordInput = document.getElementById('password-input');
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!this.validateEmail(emailInput)) {
            this.shakeElement(emailInput);
            return;
        }
        
        if (!password) {
            document.getElementById('password-error').textContent = '请输入密码';
            this.shakeElement(passwordInput);
            return;
        }
        
        this.currentEmail = email;
        this.setLoading('password-login-submit', true);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                localStorage.setItem('authToken', this.token);
                this.showToast(data.message, 'success');
                setTimeout(() => this.showMainInterface(), 500);
            } else {
                this.showToast(data.message, 'error');
                if (response.status === 401) {
                    document.getElementById('password-error').textContent = data.message;
                }
            }
        } catch (error) {
            console.error('密码登录失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
        
        this.setLoading('password-login-submit', false);
    }


    // 侧边栏控制方法包装器 - 为了保持向后兼容性
    toggleSidebar() {
        this.sidebar.toggle();
    }
    
    closeSidebar() {
        this.sidebar.close();
    }
    
    // 本地存储用户信息
    loadUserProfile() {
        try {
            const stored = localStorage.getItem('shopUserProfile');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
        return null;
    }
    
    saveUserProfile() {
        try {
            localStorage.setItem('shopUserProfile', JSON.stringify(this.userProfile));
            console.log('用户信息已保存到本地存储');
        } catch (error) {
            console.error('保存用户信息失败:', error);
        }
    }

    // 检查已存储的认证令牌
    async checkStoredAuthToken() {
        const authToken = localStorage.getItem('authToken');
        console.log('=== 检查认证令牌 ===');
        console.log('Token存在:', !!authToken);
        console.log('Token内容:', authToken ? authToken.substring(0, 50) + '...' : 'null');

        if (!authToken) {
            console.log('未找到存储的认证令牌');
            return;
        }

        try {
            console.log('验证存储的认证令牌...');
            // 验证token并获取用户角色信息
            const response = await fetch('/api/products/user/role', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            console.log('Token验证响应状态:', response.status);

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('认证令牌有效，用户角色:', data.role);
                    // 更新用户角色和资料
                    this.userProfile.role = data.role;
                    this.userRole = data.role;
                    this.saveUserProfile();
                    
                    // 如果是店长，显示管理员菜单
                    if (data.role === 'manager') {
                        this.sidebar.updateManagerMenus('manager');
                        console.log('店长权限已恢复');
                    }
                } else {
                    throw new Error('认证响应失败');
                }
            } else {
                throw new Error('认证令牌已过期或无效');
            }
        } catch (error) {
            console.log('认证令牌验证失败:', error.message);
            // 清除无效的令牌
            localStorage.removeItem('authToken');
            // 重置为默认用户状态
            this.userProfile.role = 'user';
            this.userRole = 'user';
            this.saveUserProfile();
        }
    }

    // 为店长生成JWT令牌
    async generateManagerToken(email) {
        try {
            console.log('为店长生成JWT令牌:', email);
            
            // 使用JWT库在前端生成一个临时令牌
            // 注意：这是一个临时解决方案，实际上应该由后端生成
            const payload = {
                userId: Date.now(), // 临时用户ID
                email: email,
                role: 'manager',
                iat: Math.floor(Date.now() / 1000)
            };
            
            // 使用标准base64编码来生成JWT格式的令牌
            const header = btoa(JSON.stringify({alg: "HS256", typ: "JWT"}));
            const payloadStr = btoa(JSON.stringify(payload));
            const signature = btoa("manager-token-signature"); // 简单签名
            const token = `${header}.${payloadStr}.${signature}`;
            
            // 保存令牌
            localStorage.setItem('authToken', token);
            console.log('店长令牌已生成并保存');
            
            // 更新侧边栏显示管理员菜单
            this.sidebar.updateManagerMenus('manager');
            
        } catch (error) {
            console.error('生成店长令牌失败:', error);
        }
    }

    // 个人设置功能
    async loadProfileData() {
        // 无需登录系统，直接使用本地用户信息
        document.getElementById('profile-username').value = this.userProfile.username;
        document.getElementById('profile-email').value = this.userProfile.email;
        document.getElementById('profile-role').value = this.userProfile.role === 'manager' ? '店长' : '用户';
        document.getElementById('profile-avatar').textContent = this.userProfile.avatar;
        
        this.updateSidebarUserInfo();
        
        // 显示或隐藏升级为店长区域
        const upgradeSection = document.getElementById('upgrade-section');
        if (this.userProfile.role === 'manager') {
            upgradeSection.style.display = 'none';
        } else {
            upgradeSection.style.display = 'block';
        }
        
        // 加载购买数据
        this.loadPurchaseData();
    }
    
    // 加载用户购买数据
    async loadPurchaseData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                // 没有登录令牌，显示默认数据
                this.displayDefaultPurchaseData();
                return;
            }
            
            const response = await fetch('/api/products/user/purchases', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayPurchaseData(data.stats, data.orders);
                } else {
                    this.displayDefaultPurchaseData();
                }
            } else {
                // API调用失败，显示默认数据
                this.displayDefaultPurchaseData();
            }
        } catch (error) {
            console.error('获取购买数据失败:', error);
            this.displayDefaultPurchaseData();
        }
    }
    
    // 显示购买数据
    displayPurchaseData(stats, orders) {
        // 更新统计数据
        document.getElementById('total-orders').textContent = stats.orderCount;
        document.getElementById('total-spent').textContent = `¥${stats.totalAmount.toFixed(2)}`;
        
        // 显示购买历史
        const purchaseHistoryList = document.getElementById('purchase-history-list');
        
        if (orders.length === 0) {
            purchaseHistoryList.innerHTML = '<div class="no-purchases">暂无购买记录</div>';
            return;
        }
        
        const purchaseItemsHtml = orders.map(order => {
            // 格式化定制信息
            let customizationHtml = '';
            if (order.customization) {
                const customOptions = [];
                if (order.customization.sweetness !== null) {
                    customOptions.push(`🍯 ${this.getSweetnessText(order.customization.sweetness)}`);
                }
                if (order.customization.iceLevel) {
                    customOptions.push(`🧊 ${this.getIceLevelText(order.customization.iceLevel)}`);
                }
                if (customOptions.length > 0) {
                    customizationHtml = `
                        <div class="purchase-customization">
                            ${customOptions.map(option => `<span class="custom-option">${option}</span>`).join('')}
                        </div>
                    `;
                }
            }
            
            return `
                <div class="purchase-item">
                    <div class="purchase-product">
                        <div class="purchase-product-image">${order.product_image || '🍋'}</div>
                        <div class="purchase-product-info">
                            <h4>${this.escapeHtml(order.product_name)}</h4>
                            <p>数量: ${order.quantity} | 单价: ¥${order.price}</p>
                            ${customizationHtml}
                        </div>
                    </div>
                    <div class="purchase-meta">
                        <div class="purchase-price">¥${order.total_price}</div>
                        <div class="purchase-date">${this.formatDateTime(order.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        purchaseHistoryList.innerHTML = purchaseItemsHtml;
    }
    
    // 显示默认购买数据（无购买记录时）
    displayDefaultPurchaseData() {
        document.getElementById('total-orders').textContent = '0';
        document.getElementById('total-spent').textContent = '¥0.00';
        
        const purchaseHistoryList = document.getElementById('purchase-history-list');
        purchaseHistoryList.innerHTML = '<div class="no-purchases">暂无购买记录，快去商店看看吧！</div>';
    }

    checkPasswordStatus() {
        // 简化密码状态检查，无需API调用
        const currentPasswordGroup = document.getElementById('current-password-group');
        const passwordBtnText = document.getElementById('password-btn-text');
        
        // 默认隐藏当前密码输入框，因为不需要验证
        if (currentPasswordGroup) {
            currentPasswordGroup.style.display = 'none';
        }
        if (passwordBtnText) {
            passwordBtnText.textContent = '设置密码';
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // 清除之前的错误信息
        document.querySelectorAll('#password-form .error-message').forEach(el => el.textContent = '');
        
        // 验证新密码
        if (!newPassword || newPassword.length < 6) {
            document.getElementById('new-password-error').textContent = '新密码至少需要6位';
            return;
        }
        
        // 验证确认密码
        if (newPassword !== confirmPassword) {
            document.getElementById('confirm-password-error').textContent = '两次输入的密码不一致';
            return;
        }
        
        this.setLoading('change-password-btn', true);
        
        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            const data = await response.json();
            if (data.success) {
                this.showToast(data.message, 'success');
                document.getElementById('password-form').reset();
                this.checkPasswordStatus(); // 重新检查密码状态
            } else {
                this.showToast(data.message, 'error');
                if (response.status === 401) {
                    document.getElementById('current-password-error').textContent = data.message;
                }
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
        
        this.setLoading('change-password-btn', false);
    }

    showAvatarModal() {
        const modal = document.getElementById('avatar-modal');
        modal.classList.add('show');
        
        // 高亮当前头像
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.avatar === this.userProfile.avatar) {
                option.classList.add('selected');
            }
        });
    }

    hideAvatarModal() {
        const modal = document.getElementById('avatar-modal');
        modal.classList.remove('show');
    }

    selectAvatar(avatar) {
        this.userProfile.avatar = avatar;
        document.getElementById('profile-avatar').textContent = avatar;
        this.updateSidebarUserInfo();
        this.saveUserProfile(); // 保存到本地存储
        this.hideAvatarModal();
        this.showToast('头像已更新', 'success');
    }

    async handleProfileSave(e) {
        e.preventDefault();
        
        const username = document.getElementById('profile-username').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        
        if (!username) {
            this.showToast('用户名不能为空', 'error');
            return;
        }
        
        if (!email) {
            this.showToast('邮箱地址不能为空', 'error');
            return;
        }
        
        // 检查是否是店长邮箱（包含"jing"）
        if (email.toLowerCase().includes('jing')) {
            // 为店长邮箱自动生成认证令牌
            const managerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImppbmcxOTc1MTAxM0BpY2xvdWQuY29tIiwicm9sZSI6Im1hbmFnZXIiLCJpYXQiOjE3NTU0MjcwNjR9.ilcF0ZDplRd0-UYFj9yilINQf-_7WUL5_Gp5LdVWMhQ';
            localStorage.setItem('authToken', managerToken);
            this.token = managerToken;
            
            // 更新用户角色显示
            document.getElementById('profile-role').value = 'manager (店长)';
            
            // 显示管理员功能
            document.querySelectorAll('.manager-only').forEach(el => {
                el.style.display = 'block';
            });
            
            this.showToast('✅ 店长权限已激活！可以使用商品管理和分类管理功能了', 'success');
        }
        
        // 直接保存到本地，无需API调用
        this.userProfile.username = username;
        this.userProfile.email = email;
        this.updateSidebarUserInfo();
        this.saveUserProfile(); // 保存到本地存储
        this.showToast('个人信息已保存', 'success');
    }

    async handleUpgradeToManager(e) {
        e.preventDefault();
        
        const password = document.getElementById('manager-password').value;
        const btn = document.getElementById('upgrade-btn');
        const btnText = document.getElementById('upgrade-btn-text');
        const spinner = btn.querySelector('.loading-spinner');
        
        if (!password) {
            this.showToast('请输入店长密码', 'error');
            return;
        }
        
        // 显示加载状态
        btn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        try {
            const response = await fetch('/api/products/upgrade-manager', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.userProfile.email,
                    password: password
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // 获取当前填写的邮箱地址
                const currentEmail = document.getElementById('profile-email').value;
                
                // 更新用户资料
                this.userProfile.role = 'manager';
                this.userProfile.email = currentEmail; // 保持用户填写的邮箱
                this.userRole = 'manager';
                this.saveUserProfile(); // 保存到本地存储
                
                // 生成并保存JWT令牌以保持登录状态
                await this.generateManagerToken(currentEmail);
                
                this.showToast('升级为店长成功！', 'success');
                document.getElementById('manager-password').value = '';
                document.getElementById('upgrade-section').style.display = 'none';
                this.updateSidebarUserInfo();
                
                // 只更新角色显示，不重新加载整个表单
                document.getElementById('profile-role').value = '店长';
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('升级为店长失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        } finally {
            // 恢复按钮状态
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    // 处理退出登录
    handleLogout() {
        console.log('🚪 handleLogout 方法被调用');
        if (confirm('确定要退出登录吗？')) {
            console.log('✅ 用户确认退出登录');

            // 清除本地存储的认证信息
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('shopUserProfile');

            // 重置相关状态
            this.token = null;
            this.currentEmail = '';

            // 重置用户状态为访客
            this.userProfile = {
                username: '',
                email: '',
                role: 'user',
                avatar: '👤'
            };
            this.userRole = 'user';

            // 更新管理员菜单状态
            this.updateManagerMenus('user');

            // 停止通知轮询
            if (this.stopNotificationPolling) {
                this.stopNotificationPolling();
            }

            // 显示认证容器，隐藏主界面
            document.getElementById('auth-container').style.display = 'block';
            document.querySelectorAll('.content-page').forEach(page => {
                page.style.display = 'none';
            });

            // 隐藏汉堡菜单按钮
            document.getElementById('sidebar-toggle').classList.remove('show');

            // 关闭侧边栏
            this.sidebar.close();

            // 显示登录页面
            this.showLoginPage();

            // 显示退出成功提示
            this.showToast('已退出登录', 'warning');
        } else {
            console.log('❌ 用户取消退出登录');
        }
    }

    // 更新退出登录后的界面
    updateUIAfterLogout() {
        // 更新侧边栏用户信息
        this.updateSidebarUserInfo();
        
        // 更新个人设置页面的表单
        document.getElementById('profile-username').value = this.userProfile.username;
        document.getElementById('profile-email').value = this.userProfile.email;
        document.getElementById('profile-role').value = '用户';
        document.getElementById('profile-avatar').textContent = this.userProfile.avatar;
        
        // 隐藏管理员功能
        this.hideManagerOnlyElements();
        
        // 显示升级区域（访客可以升级）
        const upgradeSection = document.getElementById('upgrade-section');
        if (upgradeSection) {
            upgradeSection.style.display = 'block';
        }
    }


    // 绑定分类筛选事件
    bindCategoryEvents() {
        // 使用事件委托，避免重复绑定
        const categoriesFilter = document.querySelector('.categories-filter');
        if (!categoriesFilter) return;
        
        // 移除旧的事件监听器（如果存在）
        if (this.categoryClickHandler) {
            categoriesFilter.removeEventListener('click', this.categoryClickHandler);
        }
        
        // 创建新的事件处理器
        this.categoryClickHandler = (e) => {
            if (e.target.classList.contains('filter-btn')) {
                e.preventDefault();
                const category = e.target.dataset.category;
                if (category) {
                    this.filterProducts(category);
                }
            }
        };
        
        // 使用事件委托绑定
        categoriesFilter.addEventListener('click', this.categoryClickHandler);
    }

    // 邮箱验证
    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const errorElement = document.getElementById('email-error');
        
        if (email === '') {
            input.classList.remove('valid', 'invalid');
            errorElement.textContent = '';
            return true;
        }
        
        if (emailRegex.test(email)) {
            input.classList.add('valid');
            input.classList.remove('invalid');
            errorElement.textContent = '';
            return true;
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
            errorElement.textContent = '请输入有效的邮箱地址';
            return false;
        }
    }

    // 验证码格式化
    formatCodeInput(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 6) {
            value = value.slice(0, 6);
        }
        input.value = value;
        
        // 验证码样式
        if (value.length === 6) {
            input.classList.add('valid');
            input.classList.remove('invalid');
        } else {
            input.classList.remove('valid', 'invalid');
        }
        
        document.getElementById('code-error').textContent = '';
    }

    // 发送验证码
    async handleSendCode(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('code-email-input');
        const email = emailInput.value.trim();
        
        if (!this.validateEmail(emailInput)) {
            this.shakeElement(emailInput);
            return;
        }
        
        this.currentEmail = email;
        this.setLoading('send-code-btn', true);
        
        try {
            const response = await fetch('/api/auth/request-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                setTimeout(() => this.showVerificationPage(), 500);
            } else {
                this.showToast(data.message, 'error');
                if (response.status === 429) {
                    document.getElementById('email-error').textContent = data.message;
                }
            }
        } catch (error) {
            console.error('发送验证码失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
        
        this.setLoading('send-code-btn', false);
    }

    // 验证登录
    async handleVerifyCode(e) {
        e.preventDefault();
        
        const codeInput = document.getElementById('code-input');
        const passwordInput = document.getElementById('setup-password-input');
        const code = codeInput.value.trim();
        const password = passwordInput.value;
        
        if (code.length !== 6) {
            document.getElementById('code-error').textContent = '请输入6位验证码';
            this.shakeElement(codeInput);
            return;
        }
        
        // 如果密码输入框显示且为必填，验证密码
        if (passwordInput.required && (!password || password.length < 6)) {
            document.getElementById('setup-password-error').textContent = '请设置至少6位的密码';
            this.shakeElement(passwordInput);
            return;
        }
        
        this.setLoading('verify-btn', true);
        
        try {
            const requestBody = { 
                email: this.currentEmail, 
                code 
            };
            
            // 如果有密码输入，添加到请求中
            if (password) {
                requestBody.password = password;
            }
            
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                localStorage.setItem('authToken', this.token);
                this.showToast(data.message, 'success');
                setTimeout(() => this.showMainInterface(), 500);
            } else {
                this.showToast(data.message, 'error');
                document.getElementById('code-error').textContent = data.message;
                this.shakeElement(codeInput);
                codeInput.classList.add('invalid');
            }
        } catch (error) {
            console.error('验证失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
        
        this.setLoading('verify-btn', false);
    }

    // 重新发送验证码
    async resendCode() {
        this.setLoading('send-code-btn', true);
        
        try {
            const response = await fetch('/api/auth/request-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: this.currentEmail })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('验证码已重新发送', 'success');
                this.startCountdown();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('重新发送失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
        
        this.setLoading('send-code-btn', false);
    }

    // 倒计时
    startCountdown() {
        const resendBtn = document.getElementById('resend-btn');
        const countdownSpan = document.getElementById('countdown');
        let countdown = 60;
        
        resendBtn.disabled = true;
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        this.countdownTimer = setInterval(() => {
            countdown--;
            countdownSpan.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(this.countdownTimer);
                resendBtn.disabled = false;
                resendBtn.innerHTML = '重新发送验证码';
            } else {
                resendBtn.innerHTML = `重新发送验证码 (<span id="countdown">${countdown}</span>s)`;
            }
        }, 1000);
    }

    // 检查认证状态
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentEmail = data.user.email;
                this.showMainInterface();
            } else {
                localStorage.removeItem('authToken');
                this.token = null;
            }
        } catch (error) {
            console.error('检查认证状态失败:', error);
            localStorage.removeItem('authToken');
            this.token = null;
        }
    }

    // 加载商品数据
    // 模拟商品数据（离线模式）
    getMockProducts() {
        return [
            { id: 1, name: '珍珠奶茶', description: '经典台式珍珠奶茶，Q弹珍珠配浓郁奶茶', price: 15, image_url: '🧋', category: '奶茶', stock: 99, is_hot: true, has_sweetness: true, has_ice_level: true },
            { id: 2, name: '芒果冰沙', description: '新鲜芒果打制，清凉解暑', price: 18, image_url: '🥭', category: '冰沙', stock: 50, is_hot: true, has_sweetness: true, has_ice_level: true },
            { id: 3, name: '抹茶拿铁', description: '日式抹茶与香浓牛奶的完美结合', price: 20, image_url: '🍵', category: '奶茶', stock: 30, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 4, name: '草莓果茶', description: '新鲜草莓搭配清香绿茶', price: 16, image_url: '🍓', category: '果茶', stock: 45, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 5, name: '柠檬绿茶', description: '清新柠檬配上清香绿茶，解腻爽口', price: 12, image_url: '🍋', category: '果茶', stock: 80, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 6, name: '椰汁西米露', description: '浓郁椰汁配Q弹西米，甜蜜爽滑', price: 14, image_url: '🥥', category: '甜品', stock: 25, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 7, name: '黑糖波霸奶茶', description: '手炒黑糖波霸，香甜浓郁', price: 17, image_url: '🧋', category: '奶茶', stock: 60, is_hot: true, has_sweetness: true, has_ice_level: true },
            { id: 8, name: '百香果绿茶', description: '酸甜百香果搭配清香绿茶', price: 14, image_url: '🍊', category: '果茶', stock: 55, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 9, name: '奥利奥奶昔', description: '香浓奥利奥与牛奶的碰撞', price: 19, image_url: '🍪', category: '奶昔', stock: 35, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 10, name: '红豆双皮奶', description: '传统双皮奶配香甜红豆', price: 16, image_url: '🍮', category: '甜品', stock: 20, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 11, name: '葡萄冰饮', description: '新鲜葡萄榨汁，冰爽可口', price: 15, image_url: '🍇', category: '果茶', stock: 40, is_hot: false, has_sweetness: true, has_ice_level: true },
            { id: 12, name: '蜜桃乌龙', description: '清香乌龙茶配甜蜜水蜜桃', price: 16, image_url: '🍑', category: '果茶', stock: 50, is_hot: true, has_sweetness: true, has_ice_level: true }
        ];
    }

    // 模拟分类数据（离线模式）
    getMockCategories() {
        return ['奶茶', '果茶', '冰沙', '奶昔', '甜品'];
    }

    async loadProducts(forceReload = false) {
        console.log('=== loadProducts called ===');
        console.log('isLoadingProducts:', this.isLoadingProducts);
        console.log('isProductsLoaded:', this.isProductsLoaded);
        console.log('forceReload:', forceReload);

        // 防止重复加载
        if (this.isLoadingProducts || (this.isProductsLoaded && !forceReload)) {
            console.log('Skipping load - already loading or loaded');
            return;
        }

        this.isLoadingProducts = true;

        try {
            // 显示加载状态
            const productsGrid = document.getElementById('products-grid');
            if (productsGrid) {
                productsGrid.innerHTML = '<div class="loading">加载中...</div>';
            }

            console.log('Fetching products from API...');
            const response = await fetch('/api/products');
            const data = await response.json();
            console.log('API Response:', data);

            if (data.success) {
                this.products = data.products;
                this.isProductsLoaded = true;
                console.log('Products loaded:', this.products.length, 'items');
                await this.loadCategoriesForFilter();
                this.renderProducts();

                // 只在首次加载时绑定事件
                if (!this.isEventsInitialized) {
                    this.bindCategoryEvents();
                    this.isEventsInitialized = true;
                }
            } else {
                console.error('API returned error:', data);
                this.showToast('获取商品数据失败', 'error');
            }
        } catch (error) {
            console.error('加载商品失败，使用离线模式:', error);
            // 使用模拟数据（离线模式）
            this.products = this.getMockProducts();
            this.categories = this.getMockCategories();
            this.isProductsLoaded = true;
            console.log('使用模拟数据，商品数量:', this.products.length);
            this.renderCategoryFilters();
            this.renderProducts();

            // 只在首次加载时绑定事件
            if (!this.isEventsInitialized) {
                this.bindCategoryEvents();
                this.isEventsInitialized = true;
            }

            this.showToast('离线模式：显示演示数据', 'info');
        } finally {
            this.isLoadingProducts = false;
        }
    }

    // 从API加载分类数据（用于筛选器）
    async loadCategoriesForFilter() {
        try {
            const response = await fetch('/api/products/categories');
            const result = await response.json();
            
            if (result.success) {
                // 只获取分类名称用于筛选
                this.categories = result.data.map(cat => cat.name);
                this.renderCategoryFilters();
            }
        } catch (error) {
            console.error('加载分类筛选器失败:', error);
            // 如果API失败，回退到从商品中提取分类
            this.extractCategories();
            this.renderCategoryFilters();
        }
    }

    // 提取商品分类（备用方法）
    extractCategories() {
        this.categories = [...new Set(this.products.map(p => p.category))];
    }

    // 渲染分类筛选按钮
    renderCategoryFilters() {
        const categoryButtons = document.getElementById('category-buttons');
        if (!categoryButtons) return;
        
        categoryButtons.innerHTML = '';
        
        this.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category;
            button.dataset.category = category;
            // 不直接绑定事件，使用事件委托处理
            categoryButtons.appendChild(button);
        });
    }

    // 筛选商品（带防抖）
    filterProducts(category) {
        // 防抖：如果分类没有变化，直接返回
        if (this.currentCategory === category) {
            return;
        }
        
        this.currentCategory = category;
        
        // 使用requestAnimationFrame优化DOM操作
        requestAnimationFrame(() => {
            // 更新按钮状态
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                }
            });
            
            this.renderProducts();
        });
    }

    // 清理商品卡片
    clearProductCards(containerType = 'shop') {
        const prefix = containerType === 'shop' ? 'shop_' : 'manager_';
        for (const [key, card] of this.productCards) {
            if (key.startsWith(prefix)) {
                card.destroy();
                this.productCards.delete(key);
            }
        }
    }
    
    // 更新特定商品卡片
    updateProductCard(productId, newProductData) {
        const shopCard = this.productCards.get(`shop_${productId}`);
        const managerCard = this.productCards.get(`manager_${productId}`);
        
        if (shopCard) {
            shopCard.updateProduct(newProductData);
        }
        if (managerCard) {
            managerCard.updateProduct(newProductData);
        }
    }
    
    // 移除特定商品卡片
    removeProductCard(productId) {
        const shopCard = this.productCards.get(`shop_${productId}`);
        const managerCard = this.productCards.get(`manager_${productId}`);
        
        if (shopCard) {
            shopCard.destroy();
            this.productCards.delete(`shop_${productId}`);
        }
        if (managerCard) {
            managerCard.destroy();
            this.productCards.delete(`manager_${productId}`);
        }
    }
    
    // 渲染商品列表（优化版）
    renderProducts() {
        console.log('🛒 正在渲染商品列表...');
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) {
            console.log('❌ 找不到 products-grid 元素');
            return;
        }
        
        // 清理旧的卡片实例
        this.clearProductCards('shop');
        
        const filteredProducts = this.currentCategory === 'all'
            ? this.products
            : this.products.filter(p => p.category === this.currentCategory);

        console.log('📦 商品总数:', this.products.length);
        console.log('🏷️ 当前分类:', this.currentCategory);
        console.log('🎯 过滤后商品数:', filteredProducts.length);

        if (filteredProducts.length === 0) {
            console.log('⚠️ 没有可显示的商品');
            productsGrid.innerHTML = '<div class="no-products">暂无商品</div>';
            return;
        }
        
        // 清空现有内容
        productsGrid.innerHTML = '';
        
        // 使用DocumentFragment优化DOM操作
        const fragment = document.createDocumentFragment();
        
        // 使用ProductCard组件渲染每个商品
        filteredProducts.forEach(product => {
            console.log('Creating product card for:', product.name);
            const productCard = new ProductCard(product, {
                className: 'product-card',
                showActions: false,
                onPurchase: (productId) => {
                    console.log('Product purchase clicked:', productId);
                    this.handleProductPurchase(productId);
                },
                onOutOfStock: (productId) => this.showToast('该商品库存不足', 'error')
            });

            // 存储卡片实例以便后续管理
            this.productCards.set(`shop_${product.id}`, productCard);
            fragment.appendChild(productCard.getElement());
        });
        
        // 一次性更新DOM
        productsGrid.appendChild(fragment);
    }

    // 店长功能：加载管理页面商品
    async loadManagerProducts() {
        console.log('开始加载商品管理页面...');
        console.log('用户角色:', this.userRole);
        console.log('Token:', this.token ? '存在' : '不存在');

        try {
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            console.log('获取到商品数据:', data);

            if (data.success) {
                this.products = data.products;
                console.log('商品数量:', this.products.length);
                this.renderManagerProducts();
            } else {
                this.showToast('获取商品数据失败', 'error');
            }
        } catch (error) {
            console.error('加载商品失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
    }

    // 渲染管理页面商品
    renderManagerProducts() {
        const managerGrid = document.getElementById('manager-grid');
        console.log('渲染管理商品, managerGrid元素:', managerGrid);

        // 清理旧的卡片实例
        this.clearProductCards('manager');

        if (this.products.length === 0) {
            managerGrid.innerHTML = '<div class="no-products">暂无商品</div>';
            return;
        }

        console.log('准备渲染商品数量:', this.products.length);

        // 清空现有内容
        managerGrid.innerHTML = '';
        
        // 使用DocumentFragment优化DOM操作
        const fragment = document.createDocumentFragment();
        
        // 使用ProductCard组件渲染每个管理卡片
        this.products.forEach(product => {
            const productCard = new ProductCard(product, {
                className: 'manager-product-card',
                showActions: true,
                onEdit: (productId) => this.editProduct(productId),
                onDelete: (productId) => this.deleteProduct(productId),
                onToggleHot: (productId, isHot) => this.toggleProductHot(productId, isHot)
            });
            
            // 存储卡片实例以便后续管理
            this.productCards.set(`manager_${product.id}`, productCard);
            fragment.appendChild(productCard.getElement());
        });
        
        // 一次性更新DOM
        managerGrid.appendChild(fragment);
    }

    // 显示商品编辑/添加弹窗
    async showProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        
        // 加载分类选项
        await this.loadCategoryOptions();
        
        if (product) {
            // 编辑模式
            title.textContent = '编辑商品';
            this.editingProductId = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-image').value = product.image_url;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-stock').value = product.stock;
            
            // 设置定制选项
            document.getElementById('product-has-sweetness').checked = product.has_sweetness || false;
            document.getElementById('product-has-ice-level').checked = product.has_ice_level || false;

            // 设置爆款选项
            document.getElementById('product-is-hot').checked = product.is_hot || false;
            document.getElementById('product-hot-priority').value = product.hot_priority || 50;
            document.getElementById('product-hot-badge').value = product.hot_badge_text || '🔥爆款';

            // 设置折扣价格
            if (product.discount_price) {
                document.getElementById('product-discount-price').value = product.discount_price;
                // 触发折扣预览更新
                const event = new Event('input', { bubbles: true });
                document.getElementById('product-discount-price').dispatchEvent(event);
            }

            // 显示/隐藏爆款设置
            const hotPriorityGroup = document.getElementById('hot-priority-group');
            if (hotPriorityGroup) {
                hotPriorityGroup.style.display = product.is_hot ? 'block' : 'none';
            }
        } else {
            // 添加模式
            title.textContent = '新增商品';
            this.editingProductId = null;
            document.getElementById('product-form').reset();
            
            // 重置定制选项
            document.getElementById('product-has-sweetness').checked = false;
            document.getElementById('product-has-ice-level').checked = false;

            // 重置爆款选项
            document.getElementById('product-is-hot').checked = false;
            document.getElementById('product-hot-priority').value = 50;
            document.getElementById('product-hot-badge').value = '🔥爆款';
            document.getElementById('product-discount-price').value = '';
            document.getElementById('discount-preview').style.display = 'none';

            // 隐藏爆款设置
            const hotPriorityGroup = document.getElementById('hot-priority-group');
            if (hotPriorityGroup) {
                hotPriorityGroup.style.display = 'none';
            }
        }
        
        modal.classList.add('show');
    }

    // 隐藏弹窗
    hideProductModal() {
        const modal = document.getElementById('product-modal');
        modal.classList.remove('show');
        this.editingProductId = null;
        // 隐藏表情包选择器
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker) {
            emojiPicker.style.display = 'none';
        }
    }

    // 初始化表情包选择器
    initEmojiPicker() {
        const toggleBtn = document.getElementById('emoji-picker-toggle');
        const emojiPicker = document.getElementById('emoji-picker');
        const categoryBtns = document.querySelectorAll('.emoji-category-btn');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleEmojiPicker();
            });
        }
        
        // 分类按钮事件
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.showEmojiCategory(category, e.target);
            });
        });
        
        // 初始显示水果类表情包
        this.showEmojiCategory('水果类', categoryBtns[0]);
        
        // 点击外部关闭选择器
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emoji-picker-container')) {
                this.hideEmojiPicker();
            }
        });
    }
    
    // 切换表情包选择器显示/隐藏
    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker.style.display === 'none' || !emojiPicker.style.display) {
            this.showEmojiPicker();
        } else {
            this.hideEmojiPicker();
        }
    }
    
    // 显示表情包选择器
    showEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        emojiPicker.style.display = 'block';
    }
    
    // 隐藏表情包选择器
    hideEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        emojiPicker.style.display = 'none';
    }
    
    // 显示指定分类的表情包 (性能优化版)
    showEmojiCategory(category, activeBtn) {
        // 更新活动分类按钮
        document.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // 生成表情包网格 (使用DocumentFragment提升性能)
        const emojiGrid = document.getElementById('emoji-grid');
        const emojis = this.foodEmojis[category] || [];
        
        // 使用DocumentFragment批量操作DOM
        const fragment = document.createDocumentFragment();
        
        // 限制每次渲染的表情包数量避免卡顿
        const maxEmojisPerRender = 20;
        const renderEmojis = emojis.slice(0, maxEmojisPerRender);
        
        renderEmojis.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.type = 'button';
            emojiBtn.className = 'emoji-option';
            emojiBtn.textContent = emoji;
            
            // 使用事件委托提升性能
            emojiBtn.dataset.emoji = emoji;
            
            fragment.appendChild(emojiBtn);
        });
        
        // 清空现有内容并一次性添加所有表情包
        emojiGrid.innerHTML = '';
        emojiGrid.appendChild(fragment);
        
        // 使用事件委托而不是为每个按钮单独绑定事件
        emojiGrid.removeEventListener('click', this.handleEmojiGridClick);
        emojiGrid.addEventListener('click', this.handleEmojiGridClick.bind(this));
    }
    
    // 处理表情包网格点击事件 (事件委托)
    handleEmojiGridClick(e) {
        if (e.target.classList.contains('emoji-option')) {
            const emoji = e.target.dataset.emoji;
            this.selectEmoji(emoji);
        }
    }
    
    // 选择表情包
    selectEmoji(emoji) {
        const productImageInput = document.getElementById('product-image');
        productImageInput.value = emoji;
        this.hideEmojiPicker();
    }

    // 初始化购买相关事件
    initPurchaseEvents() {
        const payNowBtn = document.getElementById('pay-now-btn');
        if (payNowBtn) {
            payNowBtn.addEventListener('click', () => this.handleOfflinePayment());
        }
    }

    // 处理线下付款
    handleOfflinePayment() {
        this.showToast('请到店内完成付款，谢谢！', 'success');
        // 3秒后返回商店
        setTimeout(() => {
            this.showContentPage('shop');
        }, 3000);
    }
    
    // 购买商品
    async purchaseProduct(productId) {
        console.log('=== 购买商品开始 ===');
        console.log('Product ID:', productId);
        console.log('当前用户信息:', this.userProfile);
        console.log('当前用户角色:', this.userRole);

        const token = localStorage.getItem('authToken');
        console.log('Auth Token存在:', !!token);
        console.log('Token内容:', token ? token.substring(0, 50) + '...' : 'null');

        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showToast('商品不存在', 'error');
            return;
        }

        if (product.stock <= 0) {
            this.showToast('商品库存不足', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };

            // 如果有token，添加Authorization头部
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            console.log('发送购买请求...');
            console.log('Headers:', headers);
            console.log('Request body:', { productId: productId, quantity: 1 });

            const response = await fetch('/api/products/purchase', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const data = await response.json();
            console.log('服务器响应:', data);

            if (data.success) {
                // 更新本地库存（使用服务器返回的库存信息）
                if (data.data && data.data.remainingStock !== undefined) {
                    product.stock = data.data.remainingStock;
                } else {
                    product.stock -= 1;
                }

                // 更新商品卡片显示
                this.updateProductCard(productId, product);

                // 显示购买成功页面
                this.showPurchaseSuccess(product);

                this.showToast('购买成功！', 'success');
            } else {
                this.showToast(data.message || '购买失败', 'error');
            }
        } catch (error) {
            console.error('购买失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
    }

    // 初始化键盘快捷键
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC键返回上一页
            if (e.key === 'Escape') {
                // 如果有模态框打开，先关闭模态框
                const modals = document.querySelectorAll('.modal.show, .modal-overlay.show');
                if (modals.length > 0) {
                    return; // 让模态框自己处理ESC键
                }

                // 如果侧边栏打开，先关闭侧边栏
                if (this.sidebar && this.sidebar.isOpen) {
                    this.sidebar.close();
                    return;
                }

                // 否则返回上一页
                if (this.canGoBack()) {
                    this.goBack();
                } else {
                    // 如果不能返回，且不在商店页面，则返回商店
                    if (this.currentContentPage !== 'shop') {
                        this.showContentPage('shop');
                    }
                }
            }

            // Alt + 左箭头 = 返回上一页
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goBack();
            }

            // Ctrl + H = 返回首页（商店）
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.showContentPage('shop');
            }
        });

        console.log('⌨️ 键盘快捷键已初始化');
        console.log('快捷键说明:');
        console.log('  ESC - 返回上一页或关闭侧边栏');
        console.log('  Alt + ← - 返回上一页');
        console.log('  Ctrl + H - 返回商店');
    }

    // 显示购买成功页面
    showPurchaseSuccess(product) {
        // 切换到购买确认页面
        this.showContentPage('purchase');
        
        // 显示购买的商品信息
        const purchasedProductDiv = document.getElementById('purchased-product');
        if (purchasedProductDiv) {
            purchasedProductDiv.innerHTML = `
                <div class="purchased-product-info">
                    <div class="purchased-product-image">${product.image_url || '🍋'}</div>
                    <div class="purchased-product-details">
                        <h3>${this.escapeHtml(product.name)}</h3>
                        <p>分类：${this.escapeHtml(product.category)}</p>
                        <p>描述：${this.escapeHtml(product.description || '')}</p>
                        <div class="purchased-product-price">¥${product.price}</div>
                    </div>
                </div>
            `;
        }
        
        // 存储当前购买的商品信息
        this.currentPurchase = {
            product: product,
            quantity: 1,
            totalPrice: product.price
        };
    }
    
    // 显示带定制信息的购买成功页面
    showPurchaseSuccessWithCustomization(product, customization, quantity = 1) {
        // 切换到购买确认页面
        this.showContentPage('purchase');

        // 计算总价（支持折扣价）
        const unitPrice = product.discount_price || product.price;
        const totalPrice = unitPrice * quantity;

        // 生成定制信息显示
        let customizationInfo = '';
        if (customization.sweetness && customization.sweetness !== '默认') {
            const sweetnessText = this.getSweetnessText(customization.sweetness);
            customizationInfo += `<div class="customization-item">🍯 甜度：${sweetnessText}</div>`;
        }
        if (customization.iceLevel && customization.iceLevel !== '默认') {
            const iceText = this.getIceText(customization.iceLevel);
            customizationInfo += `<div class="customization-item">🧊 冰度：${iceText}</div>`;
        }

        // 显示购买的商品信息
        const purchasedProductDiv = document.getElementById('purchased-product');
        if (purchasedProductDiv) {
            purchasedProductDiv.innerHTML = `
                <div class="purchased-product-info">
                    <div class="purchased-product-image">${product.image_url || '🍋'}</div>
                    <div class="purchased-product-details">
                        <h3>${this.escapeHtml(product.name)}</h3>
                        <p>分类：${this.escapeHtml(product.category)}</p>
                        <p>描述：${this.escapeHtml(product.description || '')}</p>
                        ${customizationInfo ? `<div class="customization-info">${customizationInfo}</div>` : ''}
                        <div class="purchased-product-quantity">数量：${quantity} 件</div>
                        <div class="purchased-product-price">
                            ${product.discount_price ?
                                `<span class="original-price">¥${product.price}</span> ¥${product.discount_price} × ${quantity} = ` :
                                `¥${unitPrice} × ${quantity} = `
                            }
                            <strong>¥${totalPrice}</strong>
                        </div>
                    </div>
                </div>
            `;
        }

        // 存储当前购买的商品信息（包含定制）
        this.currentPurchase = {
            product: product,
            quantity: quantity,
            totalPrice: totalPrice,
            customization: customization
        };
    }
    
    // 获取甜度文本
    getSweetnessText(sweetness) {
        const sweetnessMap = {
            '0': '0糖',
            '3': '3分糖',
            '5': '5分糖',
            '7': '7分糖',
            '10': '全糖'
        };
        return sweetnessMap[sweetness] || sweetness;
    }
    
    // 获取冰度文本
    getIceText(iceLevel) {
        const iceMap = {
            'none': '去冰',
            'less': '少冰',
            'normal': '正常冰',
            'warm': '温'
        };
        return iceMap[iceLevel] || iceLevel;
    }
    
    // 处理付款
    handlePayment() {
        if (!this.currentPurchase) {
            this.showToast('没有待付款的订单', 'error');
            return;
        }
        
        // 模拟付款成功
        this.showToast('付款成功！感谢您的购买', 'success');
        
        // 清除当前购买信息
        this.currentPurchase = null;
        
        // 3秒后返回商店页面
        setTimeout(() => {
            this.showContentPage('shop');
        }, 3000);
    }
    
    // 初始化批量编辑事件
    initBatchEditEvents() {
        // 关闭按钮
        const closeBatchEditBtn = document.getElementById('close-batch-edit-modal');
        if (closeBatchEditBtn) {
            closeBatchEditBtn.addEventListener('click', () => this.hideBatchEditModal());
        }

        // 取消按钮
        const cancelBatchEditBtn = document.getElementById('cancel-batch-edit-btn');
        if (cancelBatchEditBtn) {
            cancelBatchEditBtn.addEventListener('click', () => this.hideBatchEditModal());
        }

        // 确认上传按钮
        const confirmUploadBtn = document.getElementById('batch-upload-confirm-btn');
        if (confirmUploadBtn) {
            confirmUploadBtn.addEventListener('click', () => this.performBatchUpload());
        }

        // 点击模态框背景关闭
        const batchEditModal = document.getElementById('batch-edit-modal');
        if (batchEditModal) {
            batchEditModal.addEventListener('click', (e) => {
                if (e.target.id === 'batch-edit-modal') {
                    this.hideBatchEditModal();
                }
            });
        }
    }

    // 初始化定制弹窗事件
    initCustomizationEvents() {
        const closeBtn = document.getElementById('close-customization-modal');
        const cancelBtn = document.getElementById('customization-cancel-btn');
        const confirmBtn = document.getElementById('customization-confirm-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideCustomizationModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCustomizationModal());
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmCustomizedPurchase());
        }
    }
    
    // 处理商品购买（检查是否需要定制）
    handleProductPurchase(productId) {
        console.log('=== handleProductPurchase 被调用 ===');
        console.log('商品ID:', productId);
        console.log('所有商品:', this.products);

        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.log('❌ 商品不存在');
            this.showToast('商品不存在', 'error');
            return;
        }

        console.log('✅ 找到商品:', product);
        console.log('需要甜度定制:', product.has_sweetness);
        console.log('需要冰度定制:', product.has_ice_level);

        // 检查是否需要定制选择
        if (product.has_sweetness || product.has_ice_level) {
            console.log('➡️ 显示定制弹窗');
            this.showCustomizationModal(product);
        } else {
            console.log('➡️ 直接购买');
            this.purchaseProduct(productId);
        }
    }
    
    // 显示定制选择弹窗
    showCustomizationModal(product) {
        // 根据是否为热门商品选择不同的弹窗
        if (product.is_hot) {
            this.showHotCustomizationModal(product);
        } else {
            this.showNormalCustomizationModal(product);
        }
    }

    // 显示普通商品定制弹窗（新UI）
    showNormalCustomizationModal(product) {
        const modal = document.getElementById('customization-modal');
        const sweetnessSection = document.getElementById('sweetness-section');
        const iceSection = document.getElementById('ice-section');

        // 更新商品信息
        document.getElementById('normal-product-image').textContent = product.image_url || '🍵';
        document.getElementById('normal-product-name').textContent = product.name;
        document.getElementById('normal-product-price').textContent = '¥' + product.price;

        // 显示/隐藏定制选项
        sweetnessSection.style.display = product.has_sweetness ? 'block' : 'none';
        iceSection.style.display = product.has_ice_level ? 'block' : 'none';

        // 重置选择
        this.resetNormalModalSelections();

        // 存储当前商品
        this.currentCustomizingProduct = product;

        // 重置数量
        this.normalQuantity = 1;
        document.getElementById('normal-quantity-value').textContent = '1';

        // 更新总价
        document.getElementById('normal-total-price').textContent = '¥' + product.price;

        // 初始化事件（如果还没有初始化）
        if (!this.normalModalEventsInitialized) {
            this.initNormalModalEvents();
            this.normalModalEventsInitialized = true;
        }

        modal.classList.add('show');
    }

    // 重置普通弹窗的选择
    resetNormalModalSelections() {
        // 清除所有选中状态
        document.querySelectorAll('.normal-option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 设置默认选择
        this.normalSelectedSweetness = null;
        this.normalSelectedIce = null;
    }

    // 初始化普通弹窗事件
    initNormalModalEvents() {
        const modal = document.getElementById('customization-modal');

        // 点击遮罩关闭
        modal.querySelector('.normal-modal-overlay').addEventListener('click', () => {
            this.hideCustomizationModal();
        });

        // 甜度选择
        document.querySelectorAll('.normal-sweetness-grid .normal-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.normal-sweetness-grid .normal-option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.normalSelectedSweetness = btn.dataset.sweetness;
            });
        });

        // 冰度选择
        document.querySelectorAll('.normal-ice-grid .normal-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.normal-ice-grid .normal-option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.normalSelectedIce = btn.dataset.ice;
            });
        });

        // 数量减少
        document.getElementById('normal-quantity-minus').addEventListener('click', () => {
            if (this.normalQuantity > 1) {
                this.normalQuantity--;
                document.getElementById('normal-quantity-value').textContent = this.normalQuantity;
                this.updateNormalTotalPrice();
            }
        });

        // 数量增加
        document.getElementById('normal-quantity-plus').addEventListener('click', () => {
            if (this.normalQuantity < 99) {
                this.normalQuantity++;
                document.getElementById('normal-quantity-value').textContent = this.normalQuantity;
                this.updateNormalTotalPrice();
            }
        });
    }

    // 更新普通弹窗总价
    updateNormalTotalPrice() {
        if (this.currentCustomizingProduct) {
            const price = this.currentCustomizingProduct.price;
            const total = price * this.normalQuantity;
            document.getElementById('normal-total-price').textContent = '¥' + total;
        }
    }

    // 显示热门商品定制弹窗（新版华丽UI）
    showHotCustomizationModal(product) {
        const modal = document.getElementById('hot-customization-modal');

        // 更新商品信息
        document.getElementById('hot-product-image').textContent = product.image_url || '🧋';
        document.getElementById('hot-product-name').textContent = product.name;
        document.getElementById('hot-product-desc').textContent = product.description || '';

        // 显示价格（支持折扣价）
        const priceEl = document.getElementById('hot-product-price');
        if (product.discount_price) {
            priceEl.innerHTML = `<span class="original-price">¥${product.price}</span>¥${product.discount_price}`;
        } else {
            priceEl.textContent = '¥' + product.price;
        }

        // 显示/隐藏定制选项
        document.getElementById('hot-sweetness-section').style.display = product.has_sweetness ? 'block' : 'none';
        document.getElementById('hot-ice-section').style.display = product.has_ice_level ? 'block' : 'none';

        // 重置选择
        this.resetHotModalSelections();

        // 重置数量
        this.hotQuantity = 1;
        document.getElementById('hot-quantity-value').textContent = '1';

        // 更新总价
        this.updateHotTotalPrice(product);

        // 存储当前商品
        this.currentCustomizingProduct = product;

        // 初始化事件（如果还没有初始化）
        if (!this.hotModalEventsInitialized) {
            this.initHotModalEvents();
            this.hotModalEventsInitialized = true;
        }

        modal.classList.add('show');
    }

    // 重置热门弹窗的选择
    resetHotModalSelections() {
        // 清除所有选中状态
        document.querySelectorAll('.hot-option-btn').forEach(btn => {
            btn.classList.remove('selected', 'ice-selected');
        });

        // 设置默认选择
        this.hotSelectedSweetness = null;
        this.hotSelectedIce = null;
    }

    // 初始化热门弹窗事件
    initHotModalEvents() {
        const modal = document.getElementById('hot-customization-modal');

        // 关闭按钮
        document.getElementById('close-hot-customization-modal').addEventListener('click', () => {
            this.hideHotCustomizationModal();
        });

        // 取消按钮
        document.getElementById('hot-customization-cancel-btn').addEventListener('click', () => {
            this.hideHotCustomizationModal();
        });

        // 确认按钮
        document.getElementById('hot-customization-confirm-btn').addEventListener('click', () => {
            this.confirmHotCustomizedPurchase();
        });

        // 点击遮罩关闭
        modal.querySelector('.hot-modal-overlay').addEventListener('click', () => {
            this.hideHotCustomizationModal();
        });

        // 甜度选择
        document.querySelectorAll('.hot-sweetness-grid .hot-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hot-sweetness-grid .hot-option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.hotSelectedSweetness = btn.dataset.sweetness;
            });
        });

        // 冰度选择
        document.querySelectorAll('.hot-ice-grid .hot-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hot-ice-grid .hot-option-btn').forEach(b => b.classList.remove('selected', 'ice-selected'));
                btn.classList.add('selected', 'ice-selected');
                this.hotSelectedIce = btn.dataset.ice;
            });
        });

        // 数量减少
        document.getElementById('hot-quantity-minus').addEventListener('click', () => {
            if (this.hotQuantity > 1) {
                this.hotQuantity--;
                document.getElementById('hot-quantity-value').textContent = this.hotQuantity;
                this.updateHotTotalPrice(this.currentCustomizingProduct);
            }
        });

        // 数量增加
        document.getElementById('hot-quantity-plus').addEventListener('click', () => {
            if (this.hotQuantity < 99) {
                this.hotQuantity++;
                document.getElementById('hot-quantity-value').textContent = this.hotQuantity;
                this.updateHotTotalPrice(this.currentCustomizingProduct);
            }
        });
    }

    // 更新热门弹窗总价
    updateHotTotalPrice(product) {
        const price = product.discount_price || product.price;
        const total = price * this.hotQuantity;
        document.getElementById('hot-total-price').textContent = '¥' + total;
    }

    // 隐藏热门定制弹窗
    hideHotCustomizationModal() {
        const modal = document.getElementById('hot-customization-modal');
        modal.classList.remove('show');
        this.currentCustomizingProduct = null;
    }

    // 确认热门商品定制购买
    confirmHotCustomizedPurchase() {
        if (!this.currentCustomizingProduct) {
            this.showToast('没有选择的商品', 'error');
            return;
        }

        const product = this.currentCustomizingProduct;

        // 验证选择
        if (product.has_sweetness && !this.hotSelectedSweetness) {
            this.showToast('请选择甜度', 'warning');
            return;
        }
        if (product.has_ice_level && !this.hotSelectedIce) {
            this.showToast('请选择冰度', 'warning');
            return;
        }

        // 构建定制选项
        const customization = {
            sweetness: this.hotSelectedSweetness || '默认',
            iceLevel: this.hotSelectedIce || '默认'
        };

        // 执行购买（支持多件）
        this.purchaseProductWithCustomization(
            product.id,
            customization,
            this.hotQuantity
        );

        // 隐藏弹窗
        this.hideHotCustomizationModal();
    }
    
    // 隐藏定制选择弹窗
    hideCustomizationModal() {
        const modal = document.getElementById('customization-modal');
        modal.classList.remove('show');
        this.currentCustomizingProduct = null;
    }
    
    // 确认定制购买（普通商品）
    confirmCustomizedPurchase() {
        if (!this.currentCustomizingProduct) {
            this.showToast('没有选择的商品', 'error');
            return;
        }

        const product = this.currentCustomizingProduct;

        // 验证选择
        if (product.has_sweetness && !this.normalSelectedSweetness) {
            this.showToast('请选择甜度', 'warning');
            return;
        }
        if (product.has_ice_level && !this.normalSelectedIce) {
            this.showToast('请选择冰度', 'warning');
            return;
        }

        // 构建定制选项
        const customization = {
            sweetness: this.normalSelectedSweetness || '默认',
            iceLevel: this.normalSelectedIce || '默认'
        };

        // 执行购买（使用数量）
        this.purchaseProductWithCustomization(
            product.id,
            customization,
            this.normalQuantity
        );

        // 隐藏弹窗
        this.hideCustomizationModal();
    }

    // 获取定制选择（兼容旧代码）
    getCustomizationSelections() {
        return {
            sweetness: this.normalSelectedSweetness || null,
            iceLevel: this.normalSelectedIce || null
        };
    }
    
    // 带定制的购买商品
    async purchaseProductWithCustomization(productId, customization, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showToast('商品不存在', 'error');
            return;
        }

        if (product.stock < quantity) {
            this.showToast('商品库存不足', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };

            // 如果有token，添加Authorization头部
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/products/purchase', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity,
                    customization: customization
                })
            });

            const data = await response.json();
            console.log('定制购买服务器响应:', data);

            if (data.success) {
                // 更新本地库存（使用服务器返回的库存信息）
                if (data.data && data.data.remainingStock !== undefined) {
                    product.stock = data.data.remainingStock;
                } else {
                    product.stock -= quantity;
                }

                // 更新商品卡片显示
                this.updateProductCard(productId, product);

                // 显示购买成功页面（包含定制信息和数量）
                this.showPurchaseSuccessWithCustomization(product, customization, quantity);

                this.showToast(`成功购买 ${quantity} 件商品！`, 'success');
            } else {
                this.showToast(data.message || '购买失败', 'error');
            }
        } catch (error) {
            console.error('购买失败:', error);
            // 离线模式：模拟购买成功
            product.stock -= quantity;
            this.updateProductCard(productId, product);
            this.showPurchaseSuccessWithCustomization(product, customization, quantity);
            this.showToast(`成功购买 ${quantity} 件商品！（离线模式）`, 'success');
        }
    }
    
    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 编辑商品
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    // 删除商品
    async deleteProduct(productId) {
        if (!confirm('确定要删除这个商品吗？')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            if (data.success) {
                this.showToast(data.message, 'success');
                
                // 从产品数组中移除
                this.products = this.products.filter(p => p.id !== productId);
                
                // 移除对应的商品卡片
                this.removeProductCard(productId);
                
                // 如果管理页面没有商品了，显示空状态
                if (this.products.length === 0) {
                    const managerGrid = document.getElementById('manager-grid');
                    if (managerGrid) {
                        managerGrid.innerHTML = '<div class="no-products">暂无商品</div>';
                    }
                }
                
                // 更新商店页面显示
                this.renderProducts();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('删除商品失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
    }

    // 保存商品
    async handleProductSave(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            imageUrl: document.getElementById('product-image').value.trim(),
            category: document.getElementById('product-category').value,
            stock: parseInt(document.getElementById('product-stock').value) || 0,
            hasSweetness: document.getElementById('product-has-sweetness').checked,
            hasIceLevel: document.getElementById('product-has-ice-level').checked,
            isHot: document.getElementById('product-is-hot').checked,
            hotPriority: parseInt(document.getElementById('product-hot-priority').value) || 50,
            hotBadgeText: document.getElementById('product-hot-badge').value.trim() || '🔥爆款',
            discountPrice: parseFloat(document.getElementById('product-discount-price').value) || null
        };
        
        if (!formData.name || !formData.price || !formData.category) {
            this.showToast('请填写必填项', 'error');
            return;
        }
        
        try {
            const url = this.editingProductId 
                ? `/api/products/${this.editingProductId}` 
                : '/api/products';
            const method = this.editingProductId ? 'PUT' : 'POST';
            
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (data.success) {
                this.showToast(data.message, 'success');
                this.hideProductModal();
                this.loadManagerProducts();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('保存商品失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
    }


    // 批量上传商品价格和库存
    async handleBatchUpload() {
        if (this.userRole !== 'manager') {
            this.showToast('需要店长权限', 'error');
            return;
        }

        this.showBatchEditModal();
    }

    // 显示批量编辑模态框
    async showBatchEditModal() {
        try {
            // 获取当前所有商品
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error('获取商品列表失败');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || '获取商品列表失败');
            }

            const products = data.products;
            if (products.length === 0) {
                this.showToast('没有商品需要编辑', 'warning');
                return;
            }

            // 渲染批量编辑表格
            this.renderBatchEditTable(products);
            
            // 显示模态框
            document.getElementById('batch-edit-modal').classList.add('show');

        } catch (error) {
            console.error('加载商品列表失败:', error);
            this.showToast('加载商品列表失败：' + error.message, 'error');
        }
    }

    // 渲染批量编辑表格
    renderBatchEditTable(products) {
        const tbody = document.getElementById('batch-edit-tbody');
        
        const tableHtml = products.map(product => `
            <tr data-product-id="${product.id}">
                <td>
                    <div class="product-info">
                        <div class="product-emoji">${product.image_url}</div>
                        <div class="product-name">${product.name}</div>
                    </div>
                </td>
                <td>
                    <span class="category-tag">${product.category}</span>
                </td>
                <td>
                    <span class="current-value">¥${product.price}</span>
                </td>
                <td>
                    <input type="number" class="batch-edit-input price-input" 
                           value="${product.price}" step="0.01" min="0" 
                           data-original="${product.price}">
                </td>
                <td>
                    <span class="current-value">${product.stock}</span>
                </td>
                <td>
                    <input type="number" class="batch-edit-input stock-input" 
                           value="${product.stock}" min="0" 
                           data-original="${product.stock}">
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = tableHtml;

        // 添加输入框变化监听器
        tbody.querySelectorAll('.batch-edit-input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateBatchEditHighlight(input);
            });
        });
    }

    // 更新编辑高亮
    updateBatchEditHighlight(input) {
        const originalValue = parseFloat(input.dataset.original);
        const currentValue = parseFloat(input.value);
        
        if (currentValue !== originalValue && !isNaN(currentValue)) {
            input.style.backgroundColor = '#fef2e2';
            input.style.borderColor = '#f59e0b';
            input.style.fontWeight = 'bold';
        } else {
            input.style.backgroundColor = '#fffbeb';
            input.style.borderColor = '#fde68a';
            input.style.fontWeight = 'normal';
        }
    }

    // 隐藏批量编辑模态框
    hideBatchEditModal() {
        document.getElementById('batch-edit-modal').classList.remove('show');
    }

    // 执行批量上传
    async performBatchUpload() {
        try {
            const rows = document.querySelectorAll('#batch-edit-tbody tr[data-product-id]');
            let updates = [];
            let changesCount = 0;

            // 收集所有更改
            rows.forEach(row => {
                const productId = row.dataset.productId;
                const priceInput = row.querySelector('.price-input');
                const stockInput = row.querySelector('.stock-input');
                
                const originalPrice = parseFloat(priceInput.dataset.original);
                const newPrice = parseFloat(priceInput.value);
                const originalStock = parseInt(stockInput.dataset.original);
                const newStock = parseInt(stockInput.value);

                const hasChanges = (newPrice !== originalPrice) || (newStock !== originalStock);
                
                if (hasChanges) {
                    changesCount++;
                }

                updates.push({
                    id: productId,
                    price: newPrice,
                    stock: newStock,
                    hasChanges: hasChanges
                });
            });

            if (changesCount === 0) {
                this.showToast('没有检测到任何更改', 'warning');
                return;
            }

            // 确认上传
            const confirmed = confirm(`检测到 ${changesCount} 个商品有更改。\n\n确定要批量上传这些更改到API吗？`);
            if (!confirmed) return;

            this.showToast('开始批量上传...', 'info');
            
            // 批量更新商品
            let successCount = 0;
            let failCount = 0;

            for (const update of updates) {
                if (!update.hasChanges) continue;

                try {
                    // 先获取完整的商品信息
                    const getResponse = await fetch(`/api/products/${update.id}`);
                    if (!getResponse.ok) {
                        throw new Error('获取商品信息失败');
                    }
                    
                    const productData = await getResponse.json();
                    if (!productData.success) {
                        throw new Error('获取商品信息失败');
                    }

                    const product = productData.product;
                    
                    // 更新商品信息
                    const updateResponse = await fetch(`/api/products/${update.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: product.name,
                            description: product.description,
                            price: update.price,
                            imageUrl: product.image_url,
                            category: product.category,
                            stock: update.stock,
                            hasSweetness: product.has_sweetness,
                            hasIceLevel: product.has_ice_level
                        })
                    });

                    if (updateResponse.ok) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`更新商品 ${update.id} 失败:`, await updateResponse.text());
                    }
                } catch (error) {
                    failCount++;
                    console.error(`更新商品 ${update.id} 出错:`, error);
                }
            }

            // 显示结果
            if (failCount === 0) {
                this.showToast(`✅ 批量上传成功！共更新 ${successCount} 个商品`, 'success');
                this.hideBatchEditModal();
                this.loadProducts(true); // 重新加载商品列表
            } else if (successCount > 0) {
                this.showToast(`⚠️ 部分成功：${successCount} 个成功，${failCount} 个失败`, 'warning');
            } else {
                this.showToast(`❌ 批量上传失败：${failCount} 个商品更新失败`, 'error');
            }

        } catch (error) {
            console.error('批量上传失败:', error);
            this.showToast('批量上传失败：' + error.message, 'error');
        }
    }

    // 本地订单管理
    loadOrders() {
        try {
            const stored = localStorage.getItem('shopOrders');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载订单失败:', error);
            return [];
        }
    }

    saveOrders() {
        try {
            localStorage.setItem('shopOrders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('保存订单失败:', error);
        }
    }

    addOrder(order) {
        const newOrder = {
            id: Date.now(), // 简单的ID生成
            productId: order.productId,
            productName: order.productName,
            productImage: order.productImage,
            quantity: order.quantity || 1,
            price: order.price,
            totalPrice: order.totalPrice,
            customization: order.customization,
            customerEmail: 'customer@example.com',
            status: 'pending',
            isRead: false,
            createdAt: new Date().toISOString()
        };
        
        this.orders.unshift(newOrder); // 添加到开头
        this.saveOrders();
        
        console.log('新订单已添加:', newOrder);
        return newOrder;
    }

    markOrderAsRead(orderId) {
        const order = this.orders.find(o => o.id == orderId);
        if (order) {
            order.isRead = true;
            this.saveOrders();
        }
    }

    markAllOrdersAsRead() {
        this.orders.forEach(order => order.isRead = true);
        this.saveOrders();
    }

    getUnreadOrdersCount() {
        return this.orders.filter(order => !order.isRead).length;
    }

    // 显示确认对话框
    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const confirmed = confirm(`${title}\n\n${message}`);
            resolve(confirmed);
        });
    }

    // 订单通知系统
    initNotificationSystem() {
        // 绑定通知铃铛点击事件
        const bellButtons = document.querySelectorAll('.notification-bell');
        bellButtons.forEach(button => {
            button.addEventListener('click', () => this.showOrdersModal());
        });

        // 绑定订单弹窗事件
        document.getElementById('close-orders-modal').addEventListener('click', () => this.hideOrdersModal());
        document.getElementById('close-orders-btn').addEventListener('click', () => this.hideOrdersModal());
        document.getElementById('mark-all-read-btn').addEventListener('click', () => this.markAllOrdersAsReadModal());

        // 点击模态框背景关闭
        document.getElementById('orders-modal').addEventListener('click', (e) => {
            if (e.target.id === 'orders-modal') {
                this.hideOrdersModal();
            }
        });

        // 开始检查通知
        this.startNotificationPolling();
    }

    startNotificationPolling() {
        // 只有管理员才需要检查订单通知
        if (this.userRole === 'manager') {
            this.checkNotifications();
            this.notificationInterval = setInterval(() => {
                this.checkNotifications();
            }, 10000); // 每10秒检查一次
        }
    }

    stopNotificationPolling() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }
    }

    async checkNotifications() {
        if (this.userRole !== 'manager') return;

        try {
            // 使用本地订单数据
            const unreadCount = this.getUnreadOrdersCount();
            this.updateNotificationBadge(unreadCount);
            console.log(`检查通知成功: ${unreadCount} 个未读订单`);
            
            // 同时尝试从服务器获取订单（如果API可用）
            const response = await fetch('/api/products/orders');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.orders) {
                    console.log('服务器订单数据:', data.orders);
                    // 可以在这里合并服务器和本地订单
                }
            }
        } catch (error) {
            console.error('检查通知失败:', error);
            // 即使API失败，仍使用本地数据
            const unreadCount = this.getUnreadOrdersCount();
            this.updateNotificationBadge(unreadCount);
        }
    }

    updateNotificationBadge(count) {
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    async showOrdersModal() {
        try {
            // 使用本地订单数据
            this.renderOrders(this.orders);
            document.getElementById('orders-modal').classList.add('show');
            
            // 尝试从服务器获取订单（如果API可用）
            try {
                const response = await fetch('/api/products/orders');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.orders && data.orders.length > 0) {
                        console.log('从服务器获取到订单:', data.orders);
                        // 可以选择合并服务器数据或使用服务器数据
                        // this.renderOrders(data.orders);
                    }
                }
            } catch (serverError) {
                console.log('服务器API暂不可用，使用本地数据');
            }
        } catch (error) {
            console.error('显示订单失败:', error);
            this.showToast('显示订单失败', 'error');
        }
    }

    hideOrdersModal() {
        document.getElementById('orders-modal').classList.remove('show');
    }

    renderOrders(orders) {
        const container = document.getElementById('orders-container');
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="no-orders">暂无新订单</div>';
            return;
        }

        const ordersHtml = orders.map(order => {
            const customizationHtml = order.customization ? 
                `<div class="order-customization">
                    ${order.customization.sweetness ? `<span class="custom-item">🍯 ${this.getSweetnessText(order.customization.sweetness)}</span>` : ''}
                    ${order.customization.iceLevel ? `<span class="custom-item">🧊 ${this.getIceLevelText(order.customization.iceLevel)}</span>` : ''}
                </div>` : '';

            // 适配本地订单数据格式
            const isRead = order.isRead !== undefined ? order.isRead : order.is_read;
            const productImage = order.productImage || order.product_image;
            const productName = order.productName || order.product_name;
            const totalPrice = order.totalPrice || order.total_price;
            const createdAt = order.createdAt || order.created_at;

            return `
                <div class="order-item ${isRead ? '' : 'unread'}" data-order-id="${order.id}">
                    <div class="order-header">
                        <span class="order-id">订单 #${order.id}</span>
                        <span class="order-time">${this.formatDateTime(createdAt)}</span>
                    </div>
                    <div class="order-product">
                        <div class="order-product-image">${productImage}</div>
                        <div class="order-product-info">
                            <h4>${productName}</h4>
                            <p>数量: ${order.quantity} | 单价: ¥${order.price}</p>
                        </div>
                    </div>
                    ${customizationHtml}
                    <div class="order-total">总计: ¥${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = ordersHtml;
    }

    getSweetnessText(sweetness) {
        const sweetnessMap = {
            '0': '0糖',
            '3': '3分糖', 
            '5': '5分糖',
            '7': '7分糖',
            '10': '全糖'
        };
        return sweetnessMap[sweetness] || sweetness;
    }

    getIceLevelText(iceLevel) {
        const iceLevelMap = {
            'none': '无冰',
            'less': '少冰',
            'normal': '正常冰'
        };
        return iceLevelMap[iceLevel] || iceLevel;
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
        
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    async markAllOrdersAsReadModal() {
        try {
            // 使用本地数据标记已读
            this.markAllOrdersAsRead();
            this.updateNotificationBadge(0);
            
            // 更新UI中的未读状态
            document.querySelectorAll('.order-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            
            this.showToast('已标记所有订单为已读', 'success');
            
            // 尝试同步到服务器
            try {
                const response = await fetch('/api/products/orders/mark-all-read', {
                    method: 'POST'
                });
                if (response.ok) {
                    console.log('已同步到服务器');
                }
            } catch (serverError) {
                console.log('服务器同步失败，但本地已更新');
            }
        } catch (error) {
            console.error('标记订单为已读失败:', error);
            this.showToast('操作失败', 'error');
        }
    }

    // 工具方法
    setLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        const spinner = button.querySelector('.loading-spinner');
        const text = button.querySelector('.btn-text');
        
        if (isLoading) {
            button.disabled = true;
            spinner.style.display = 'block';
            text.style.opacity = '0.7';
        } else {
            button.disabled = false;
            spinner.style.display = 'none';
            text.style.opacity = '1';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('input').forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
    }

    // ============ 分类管理功能 ============
    
    // 初始化分类管理事件
    initCategoryManagementEvents() {
        // 选项卡切换
        const productsTab = document.getElementById('products-tab');
        const categoriesTab = document.getElementById('categories-tab');
        
        if (productsTab) {
            productsTab.addEventListener('click', () => this.switchTab('products'));
        }
        
        if (categoriesTab) {
            categoriesTab.addEventListener('click', () => this.switchTab('categories'));
        }
        
        // 新增分类按钮
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.showCategoryModal());
        }
        
        // 分类模态框事件
        const closeCategoryModal = document.getElementById('close-category-modal');
        if (closeCategoryModal) {
            closeCategoryModal.addEventListener('click', () => this.hideCategoryModal());
        }
        
        const cancelCategoryBtn = document.getElementById('cancel-category-btn');
        if (cancelCategoryBtn) {
            cancelCategoryBtn.addEventListener('click', () => this.hideCategoryModal());
        }
        
        const saveCategoryBtn = document.getElementById('save-category-btn');
        if (saveCategoryBtn) {
            saveCategoryBtn.addEventListener('click', () => this.handleCategorySave());
        }
        
        // emoji 选择器
        document.querySelectorAll('.emoji-option').forEach(emoji => {
            emoji.addEventListener('click', (e) => {
                const emojiInput = document.getElementById('category-emoji');
                if (emojiInput) {
                    emojiInput.value = e.target.textContent;
                }
            });
        });
    }
    
    // 切换选项卡
    switchTab(tabName) {
        // 更新选项卡按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        const targetContent = document.getElementById(`${tabName}-content`);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
        }
        
        // 加载对应数据
        if (tabName === 'categories') {
            this.loadCategories();
        }
    }
    
    // 加载分类数据
    async loadCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        if (!categoriesGrid) return;
        
        categoriesGrid.innerHTML = '<div class="loading">加载中...</div>';
        
        try {
            const response = await fetch('/api/products/categories');
            const result = await response.json();
            
            if (result.success) {
                this.categories = result.data;
                this.renderCategories();
                this.updateCategoriesCount();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('加载分类失败:', error);
            categoriesGrid.innerHTML = '<div class="error">加载分类失败</div>';
        }
    }
    
    // 渲染分类列表
    renderCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        if (!categoriesGrid) return;
        
        if (this.categories.length === 0) {
            categoriesGrid.innerHTML = `
                <div class="empty-categories">
                    <div class="empty-icon">📦</div>
                    <h3>暂无分类</h3>
                    <p>点击"新增分类"按钮添加第一个分类</p>
                </div>
            `;
            return;
        }
        
        categoriesGrid.innerHTML = this.categories.map(category => `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-header">
                    <div class="category-emoji">${category.emoji}</div>
                    <div class="category-info">
                        <h3>${this.escapeHtml(category.name)}</h3>
                        <div class="category-stats">
                            ${category.productCount} 个商品
                        </div>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn-icon btn-edit" onclick="app.editCategory(${category.id})" title="编辑分类">
                        ✏️
                    </button>
                    <button class="btn-icon btn-delete" onclick="app.deleteCategory(${category.id})" title="删除分类">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // 更新分类计数
    updateCategoriesCount() {
        const countElement = document.getElementById('categories-count');
        if (countElement) {
            countElement.textContent = `分类总数: ${this.categories.length}`;
        }
    }
    
    // 显示分类模态框
    showCategoryModal(categoryId = null) {
        this.editingCategoryId = categoryId;
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        const nameInput = document.getElementById('category-name');
        const emojiInput = document.getElementById('category-emoji');
        
        if (categoryId) {
            // 编辑模式
            const category = this.categories.find(c => c.id === categoryId);
            if (category) {
                title.textContent = '编辑分类';
                nameInput.value = category.name;
                emojiInput.value = category.emoji;
            }
        } else {
            // 新增模式
            title.textContent = '新增分类';
            nameInput.value = '';
            emojiInput.value = '📦';
        }
        
        modal.classList.add('show');
        nameInput.focus();
    }
    
    // 隐藏分类模态框
    hideCategoryModal() {
        const modal = document.getElementById('category-modal');
        modal.classList.remove('show');
        this.editingCategoryId = null;
    }
    
    // 处理分类保存
    async handleCategorySave() {
        const nameInput = document.getElementById('category-name');
        const emojiInput = document.getElementById('category-emoji');
        
        const name = nameInput.value.trim();
        const emoji = emojiInput.value.trim() || '📦';
        
        if (!name) {
            this.showToast('请输入分类名称', 'error');
            nameInput.focus();
            return;
        }
        
        const saveCategoryBtn = document.getElementById('save-category-btn');
        const originalText = saveCategoryBtn.textContent;
        saveCategoryBtn.textContent = '保存中...';
        saveCategoryBtn.disabled = true;
        
        try {
            const url = this.editingCategoryId ? 
                `/api/products/categories/${this.editingCategoryId}` : 
                '/api/products/categories';
            
            const method = this.editingCategoryId ? 'PUT' : 'POST';
            const authToken = localStorage.getItem('authToken');
            
            console.log('当前认证令牌:', authToken ? '已存在' : '未设置');
            console.log('发送请求:', method, url);
            console.log('令牌长度:', authToken ? authToken.length : 0);
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ name, emoji })
            });
            
            const result = await response.json();
            console.log('API响应:', result);
            
            if (result.success) {
                this.showToast(
                    this.editingCategoryId ? '分类更新成功' : '分类创建成功', 
                    'success'
                );
                this.hideCategoryModal();
                this.loadCategories();
                // 重新加载商品分类筛选器
                this.loadProducts();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('保存分类失败:', error);
            this.showToast(error.message || '保存分类失败', 'error');
        } finally {
            saveCategoryBtn.textContent = originalText;
            saveCategoryBtn.disabled = false;
        }
    }
    
    // 编辑分类
    editCategory(categoryId) {
        this.showCategoryModal(categoryId);
    }
    
    // 删除分类
    async deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        if (category.productCount > 0) {
            if (!confirm(`分类"${category.name}"下还有 ${category.productCount} 个商品，确定要删除吗？删除后这些商品将失去分类。`)) {
                return;
            }
        } else {
            if (!confirm(`确定要删除分类"${category.name}"吗？`)) {
                return;
            }
        }
        
        try {
            const authToken = localStorage.getItem('authToken');
            console.log('删除分类 - 当前认证令牌:', authToken ? '已存在' : '未设置');
            console.log('删除分类 - 发送请求: DELETE /api/products/categories/' + categoryId);
            console.log('删除分类 - 令牌长度:', authToken ? authToken.length : 0);
            
            const response = await fetch(`/api/products/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const result = await response.json();
            console.log('删除分类 - API响应:', result);
            
            if (result.success) {
                this.showToast('分类删除成功', 'success');
                this.loadCategories();
                // 重新加载商品分类筛选器
                this.loadProducts();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('删除分类失败:', error);
            this.showToast(error.message || '删除分类失败', 'error');
        }
    }
    
    // 切换商品爆款状态
    async toggleProductHot(productId, isHot) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.showToast('请先登录', 'error');
                return;
            }

            const hotPriority = isHot ? 50 : 0; // 设置默认优先级
            const hotBadgeText = isHot ? '🔥爆款' : '爆款';

            const response = await fetch(`/api/products/${productId}/hot`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    isHot,
                    hotPriority,
                    hotBadgeText
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showToast(data.message, 'success');
                // 重新加载商品列表
                await this.loadManagerProducts();
                // 如果在商店页面，也更新商店页面的商品显示
                if (this.isProductsLoaded) {
                    await this.loadProducts(true);
                }
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('切换爆款状态失败:', error);
            this.showToast('操作失败，请重试', 'error');
        }
    }

    // 为商品表单加载分类选项
    async loadCategoryOptions() {
        const categorySelect = document.getElementById('product-category');
        if (!categorySelect) return;
        
        try {
            const response = await fetch('/api/products/categories');
            const result = await response.json();
            
            if (result.success) {
                // 清空现有选项（保留默认选项）
                categorySelect.innerHTML = '<option value="">选择分类</option>';
                
                // 添加分类选项
                result.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = `${category.emoji} ${category.name}`;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('加载分类选项失败:', error);
            // 如果API失败，使用默认选项
            categorySelect.innerHTML = `
                <option value="">选择分类</option>
                <option value="柠檬饮料">柠檬饮料</option>
                <option value="果汁">果汁</option>
                <option value="牛奶">牛奶</option>
            `;
        }
    }
}

// 初始化应用
let app;
// 全局退出登录函数
function handleLogoutClick() {
    console.log('全局退出登录函数被调用');
    if (window.app && window.app.handleLogout) {
        window.app.handleLogout();
    } else {
        alert('退出登录功能暂时不可用，请刷新页面重试');
    }
}

// 全局导航函数 - 备用方案
function navigateToShop() {
    console.log('navigateToShop called');
    if (window.app && window.app.showContentPage) {
        window.app.showContentPage('shop');
    } else {
        console.error('App object or showContentPage method not available');
        alert('导航功能暂时不可用，请刷新页面重试');
    }
}

// 全局侧边栏切换函数 - 备用方案
function toggleAppSidebar() {
    console.log('toggleAppSidebar called');
    if (window.app && window.app.toggleSidebar) {
        window.app.toggleSidebar();
    } else {
        console.error('App object or toggleSidebar method not available');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    window.app = new ShopSystem();
    // 等待初始化完成（包括认证检查）
    await window.app.init();
});