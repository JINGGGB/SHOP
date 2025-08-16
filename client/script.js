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
            </div>
        ` : '';
        
        const outOfStock = product.stock <= 0;
        const stockClass = outOfStock ? 'out-of-stock' : '';
        const stockText = outOfStock ? '缺货' : `库存：${product.stock} 件`;
        const clickHint = !options.showActions && !outOfStock ? '<div class="click-hint">点击购买</div>' : '';
        
        this.element.innerHTML = `
            ${actionsHtml}
            <div class="product-image ${stockClass}">
                ${product.image_url || '🍋'}
                ${outOfStock ? '<div class="sold-out-overlay">缺货</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-description">${this.escapeHtml(product.description || '')}</div>
                <div class="product-price">¥${product.price}</div>
                <div class="product-stock ${stockClass}">${stockText}</div>
                <div class="product-category">${this.escapeHtml(product.category)}</div>
                ${clickHint}
            </div>
        `;
        
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
                if (action === 'edit' && this.options.onEdit) {
                    e.stopPropagation();
                    this.options.onEdit(this.product.id);
                } else if (action === 'delete' && this.options.onDelete) {
                    e.stopPropagation();
                    this.options.onDelete(this.product.id);
                }
            });
        } else {
            // 普通模式：点击购买
            this.element.addEventListener('click', (e) => {
                // 检查库存
                if (this.product.stock <= 0) {
                    if (this.options.onOutOfStock) {
                        this.options.onOutOfStock(this.product.id);
                    }
                    return;
                }
                
                // 触发购买事件
                if (this.options.onPurchase) {
                    this.options.onPurchase(this.product.id);
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
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 侧边栏控制事件
        const toggleBtn = document.getElementById('sidebar-toggle');
        const closeBtn = document.getElementById('sidebar-close');
        const overlay = document.getElementById('sidebar-overlay');
        const avatar = document.getElementById('navbar-avatar');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                console.log('Toggle button clicked');
                this.toggle();
            });
        }
        
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
                console.log('Avatar clicked');
                this.toggle();
            });
        }
        
        // 导航菜单事件
        document.getElementById('nav-shop').addEventListener('click', (e) => this.handleNavigation(e, 'shop'));
        document.getElementById('nav-profile').addEventListener('click', (e) => this.handleNavigation(e, 'profile'));
        
        // 管理员菜单事件（如果存在）
        const navProducts = document.getElementById('nav-products');
        const navUsers = document.getElementById('nav-users');
        if (navProducts) {
            navProducts.addEventListener('click', (e) => this.handleNavigation(e, 'products'));
        }
        if (navUsers) {
            navUsers.addEventListener('click', (e) => this.handleNavigation(e, 'users'));
        }
    }

    toggle() {
        console.log('Sidebar toggle called, current state:', this.isOpen);
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggle = document.getElementById('sidebar-toggle');
        
        sidebar.classList.add('active');
        overlay.classList.add('active');
        if (toggle) toggle.classList.add('active');
        this.isOpen = true;
        
        // 防止背景滚动
        document.body.classList.add('sidebar-open');
    }

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggle = document.getElementById('sidebar-toggle');
        
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        if (toggle) toggle.classList.remove('active');
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
    }

    updateManagerMenus(userRole) {
        const managerItems = document.querySelectorAll('.manager-only');
        managerItems.forEach(item => {
            if (userRole === 'manager') {
                item.classList.add('show');
            } else {
                item.classList.remove('show');
            }
        });
        
        console.log('侧边栏角色检查:', userRole, '管理员菜单数量:', managerItems.length);
    }
}

class ShopSystem {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.userRole = 'user';
        this.editingProductId = null;
        this.currentContentPage = 'shop';
        this.notificationInterval = null;
        this.orders = this.loadOrders(); // 加载本地订单
        
        // 从本地存储加载用户信息，如果没有则使用默认值
        this.userProfile = this.loadUserProfile() || {
            username: '访客',
            email: 'guest@shop.com',
            avatar: '👤',
            role: 'user'
        };
        
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
        
        this.init();
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

    init() {
        this.bindEvents();
        this.initNotificationSystem();
        // 设置用户角色以便正确显示管理员菜单
        this.userRole = this.userProfile.role;
        // 直接加载商店页面
        this.loadShopPage();
        this.showContentPage('shop');
    }

    bindEvents() {
        // 侧边栏事件由 SidebarComponent 处理，这里只处理其他事件
        
        // 个人设置事件
        document.getElementById('change-avatar-btn').addEventListener('click', () => this.showAvatarModal());
        document.getElementById('close-avatar-modal').addEventListener('click', () => this.hideAvatarModal());
        document.getElementById('profile-form').addEventListener('submit', (e) => this.handleProfileSave(e));
        document.getElementById('upgrade-form').addEventListener('submit', (e) => this.handleUpgradeToManager(e));
        
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
        
        // 表情包选择器事件
        this.initEmojiPicker();
        
        // 购买相关事件
        this.initPurchaseEvents();
        
        // 定制弹窗事件
        this.initCustomizationEvents();

        // 批量编辑弹窗事件
        this.initBatchEditEvents();
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
        // 从服务器刷新用户资料以确保角色正确
        this.refreshUserProfile();
    }

    showContentPage(pageName) {
        // 如果已经在当前页面，不需要重新加载
        if (this.currentContentPage === pageName) {
            this.sidebar.close();
            return;
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
        }
        
        this.currentContentPage = pageName;
        this.updateNavigation(pageName);
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
            case 'users':
                this.loadUsersData();
                break;
        }
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

    // 用户管理功能（仅管理员）
    async loadUsersData() {
        if (this.userRole !== 'manager') {
            this.showToast('需要管理员权限', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/products/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                this.renderUsersGrid(data.users);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
    }

    renderUsersGrid(users) {
        const usersGrid = document.getElementById('users-grid');
        
        if (users.length === 0) {
            usersGrid.innerHTML = '<div class="loading">暂无用户</div>';
            return;
        }
        
        usersGrid.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-card-header">
                    <div class="user-card-avatar">${user.avatar || '👤'}</div>
                    <div class="user-card-info">
                        <h3>${user.username || '未设置'}</h3>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="user-role-badge ${user.role === 'manager' ? 'manager' : ''}">
                    ${user.role === 'manager' ? '店长' : '用户'}
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #6b7280;">
                    注册时间: ${new Date(user.created_at).toLocaleDateString()}
                    ${user.last_login ? `<br>最后登录: ${new Date(user.last_login).toLocaleDateString()}` : ''}
                </div>
            </div>
        `).join('');
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
    async loadProducts(forceReload = false) {
        // 防止重复加载
        if (this.isLoadingProducts || (this.isProductsLoaded && !forceReload)) {
            return;
        }
        
        this.isLoadingProducts = true;
        
        try {
            // 显示加载状态
            const productsGrid = document.getElementById('products-grid');
            if (productsGrid) {
                productsGrid.innerHTML = '<div class="loading">加载中...</div>';
            }
            
            const response = await fetch('/api/products');
            const data = await response.json();
            
            if (data.success) {
                this.products = data.products;
                this.isProductsLoaded = true;
                this.extractCategories();
                this.renderCategoryFilters();
                this.renderProducts();
                
                // 只在首次加载时绑定事件
                if (!this.isEventsInitialized) {
                    this.bindCategoryEvents();
                    this.isEventsInitialized = true;
                }
            } else {
                this.showToast('获取商品数据失败', 'error');
            }
        } catch (error) {
            console.error('加载商品失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        } finally {
            this.isLoadingProducts = false;
        }
    }

    // 提取商品分类
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
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;
        
        // 清理旧的卡片实例
        this.clearProductCards('shop');
        
        const filteredProducts = this.currentCategory === 'all' 
            ? this.products 
            : this.products.filter(p => p.category === this.currentCategory);
        
        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = '<div class="no-products">暂无商品</div>';
            return;
        }
        
        // 清空现有内容
        productsGrid.innerHTML = '';
        
        // 使用DocumentFragment优化DOM操作
        const fragment = document.createDocumentFragment();
        
        // 使用ProductCard组件渲染每个商品
        filteredProducts.forEach(product => {
            const productCard = new ProductCard(product, {
                className: 'product-card',
                showActions: false,
                onPurchase: (productId) => this.handleProductPurchase(productId),
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
        try {
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                this.products = data.products;
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
        
        // 清理旧的卡片实例
        this.clearProductCards('manager');
        
        if (this.products.length === 0) {
            managerGrid.innerHTML = '<div class="no-products">暂无商品</div>';
            return;
        }
        
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
                onDelete: (productId) => this.deleteProduct(productId)
            });
            
            // 存储卡片实例以便后续管理
            this.productCards.set(`manager_${product.id}`, productCard);
            fragment.appendChild(productCard.getElement());
        });
        
        // 一次性更新DOM
        managerGrid.appendChild(fragment);
    }

    // 显示商品编辑/添加弹窗
    showProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        
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
        } else {
            // 添加模式
            title.textContent = '新增商品';
            this.editingProductId = null;
            document.getElementById('product-form').reset();
            
            // 重置定制选项
            document.getElementById('product-has-sweetness').checked = false;
            document.getElementById('product-has-ice-level').checked = false;
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
            const response = await fetch('/api/products/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // 更新本地库存
                product.stock -= 1;
                
                // 创建订单记录
                this.addOrder({
                    productId: product.id,
                    productName: product.name,
                    productImage: product.image_url,
                    quantity: 1,
                    price: product.price,
                    totalPrice: product.price,
                    customization: null
                });
                
                // 更新商品卡片显示
                this.updateProductCard(productId, product);
                
                // 显示购买成功页面
                this.showPurchaseSuccess(product);
                
                this.showToast('预定成功！', 'success');
            } else {
                this.showToast(data.message || '购买失败', 'error');
            }
        } catch (error) {
            console.error('购买失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
        }
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
    showPurchaseSuccessWithCustomization(product, customization) {
        // 切换到购买确认页面
        this.showContentPage('purchase');
        
        // 生成定制信息显示
        let customizationInfo = '';
        if (customization.sweetness !== null) {
            const sweetnessText = this.getSweetnessText(customization.sweetness);
            customizationInfo += `<div class="customization-item">🍯 甜度：${sweetnessText}</div>`;
        }
        if (customization.iceLevel !== null) {
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
                        <div class="purchased-product-price">¥${product.price}</div>
                    </div>
                </div>
            `;
        }
        
        // 存储当前购买的商品信息（包含定制）
        this.currentPurchase = {
            product: product,
            quantity: 1,
            totalPrice: product.price,
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
            'none': '无冰',
            'less': '少冰',
            'normal': '正常冰'
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
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showToast('商品不存在', 'error');
            return;
        }
        
        // 检查是否需要定制选择
        if (product.has_sweetness || product.has_ice_level) {
            this.showCustomizationModal(product);
        } else {
            // 直接购买
            this.purchaseProduct(productId);
        }
    }
    
    // 显示定制选择弹窗
    showCustomizationModal(product) {
        const modal = document.getElementById('customization-modal');
        const productInfo = document.getElementById('customization-product-info');
        const sweetnessSection = document.getElementById('sweetness-section');
        const iceSection = document.getElementById('ice-section');
        
        // 显示商品信息
        productInfo.innerHTML = `
            <div class="customization-product-image">${product.image_url || '🍋'}</div>
            <div class="customization-product-details">
                <h3>${this.escapeHtml(product.name)}</h3>
                <div class="customization-product-price">¥${product.price}</div>
            </div>
        `;
        
        // 显示/隐藏定制选项
        sweetnessSection.style.display = product.has_sweetness ? 'block' : 'none';
        iceSection.style.display = product.has_ice_level ? 'block' : 'none';
        
        // 重置选择为默认值
        document.getElementById('sweetness-3').checked = true;
        document.getElementById('ice-normal').checked = true;
        
        // 存储当前商品
        this.currentCustomizingProduct = product;
        
        modal.classList.add('show');
    }
    
    // 隐藏定制选择弹窗
    hideCustomizationModal() {
        const modal = document.getElementById('customization-modal');
        modal.classList.remove('show');
        this.currentCustomizingProduct = null;
    }
    
    // 确认定制购买
    confirmCustomizedPurchase() {
        if (!this.currentCustomizingProduct) {
            this.showToast('没有选择的商品', 'error');
            return;
        }
        
        // 获取用户选择的定制选项
        const customization = this.getCustomizationSelections();
        
        // 执行购买
        this.purchaseProductWithCustomization(
            this.currentCustomizingProduct.id, 
            customization
        );
        
        // 隐藏弹窗
        this.hideCustomizationModal();
    }
    
    // 获取定制选择
    getCustomizationSelections() {
        const sweetnessInput = document.querySelector('input[name="sweetness"]:checked');
        const iceInput = document.querySelector('input[name="ice-level"]:checked');
        
        return {
            sweetness: sweetnessInput ? sweetnessInput.value : null,
            iceLevel: iceInput ? iceInput.value : null
        };
    }
    
    // 带定制的购买商品
    async purchaseProductWithCustomization(productId, customization) {
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
            const response = await fetch('/api/products/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1,
                    customization: customization
                })
            });
            
            const data = await response.json();
            if (data.success) {
                // 更新本地库存
                product.stock -= 1;
                
                // 创建订单记录（包含定制信息）
                this.addOrder({
                    productId: product.id,
                    productName: product.name,
                    productImage: product.image_url,
                    quantity: 1,
                    price: product.price,
                    totalPrice: product.price,
                    customization: customization
                });
                
                // 更新商品卡片显示
                this.updateProductCard(productId, product);
                
                // 显示购买成功页面（包含定制信息）
                this.showPurchaseSuccessWithCustomization(product, customization);
                
                this.showToast('预定成功！', 'success');
            } else {
                this.showToast(data.message || '购买失败', 'error');
            }
        } catch (error) {
            console.error('购买失败:', error);
            this.showToast('网络错误，请检查连接', 'error');
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
            hasIceLevel: document.getElementById('product-has-ice-level').checked
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
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
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

    // 退出登录
    handleLogout(e) {
        if (e) e.preventDefault();
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('shopUserProfile');
        this.token = null;
        this.currentEmail = '';
        this.userProfile = {
            username: '',
            email: '',
            avatar: '👤',
            role: 'user'
        };
        this.userRole = 'user';
        
        // 更新管理员菜单状态
        this.updateManagerMenus('user');
        
        // 停止通知轮询
        this.stopNotificationPolling();
        
        // 显示认证容器，隐藏主界面
        document.getElementById('auth-container').style.display = 'block';
        document.querySelectorAll('.content-page').forEach(page => {
            page.style.display = 'none';
        });
        
        // 隐藏汉堡菜单按钮
        document.getElementById('sidebar-toggle').classList.remove('show');
        
        this.sidebar.close();
        this.showLoginPage();
        this.showToast('已退出登录', 'warning');
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
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ShopSystem();
});