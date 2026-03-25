// 全局播放器管理
let currentAudio = null;
let currentPlayingUrl = null;
let currentBtnIcon = null;

function togglePlay(url, btnElement) {
    const icon = btnElement.querySelector('i');
    if (currentAudio && currentPlayingUrl === url) {
        if (currentAudio.paused) {
            currentAudio.play();
            icon.classList.replace('fa-play', 'fa-pause');
        } else {
            currentAudio.pause();
            icon.classList.replace('fa-pause', 'fa-play');
        }
        return;
    }
    if (currentAudio) {
        currentAudio.pause();
        if (currentBtnIcon) currentBtnIcon.classList.replace('fa-pause', 'fa-play');
    }
    currentAudio = new Audio(url);
    currentPlayingUrl = url;
    currentBtnIcon = icon;
    currentAudio.play();
    icon.classList.replace('fa-play', 'fa-pause');
    currentAudio.onended = () => {
        icon.classList.replace('fa-pause', 'fa-play');
        currentPlayingUrl = null;
    };
}

// 1. ============ 前台访客逻辑 ============
async function initClient() {
    const listContainer = document.getElementById('clientMusicList');
    const countDisplay = document.getElementById('musicCount');
    try {
        const res = await fetch('list.php');
        const json = await res.json();
        
        if (json.status === 'success') {
            const data = json.data;
            countDisplay.innerText = `库内容量: ${data.length}`;
            if (data.length === 0) {
                listContainer.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400">频率静默，尚未收录音源。</div>`;
                return;
            }
            listContainer.innerHTML = data.map(item => `
                <div class="glass-card p-5 rounded-2xl flex flex-col justify-between">
                    <div class="flex items-center space-x-4 mb-5">
                        <div class="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                            <i class="fa fa-music text-blue-300"></i>
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <h3 class="font-bold text-gray-100 truncate text-base" title="${item.name}">${item.name}</h3>
                            <p class="text-[11px] text-gray-400 mt-1 opacity-70">${item.date}</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between border-t border-white/5 pt-4">
                        <button onclick="togglePlay('${item.url}', this)" class="w-10 h-10 bg-white/10 hover:bg-blue-500/40 border border-white/10 rounded-full flex items-center justify-center text-white transition-all shadow-lg">
                            <i class="fa fa-play ml-1"></i>
                        </button>
                        <a href="${item.url}" download="${item.filename}" class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-all">
                            <i class="fa fa-download mr-1"></i> 下载
                        </a>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        listContainer.innerHTML = `<div class="col-span-full text-center py-20 text-red-400 bg-red-900/10 rounded-2xl border border-red-500/20">系统连接异常，请稍后再试。</div>`;
    }
}

// 2. ============ 后台(合并版)逻辑 ============
async function initAdminMerged() {
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const loginForm = document.getElementById('loginForm');
    
    // UI状态切换函数 (无需跨页面跳转)
    const showAdmin = () => {
        loginSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        document.body.classList.remove('items-center'); // 移除登录界面的垂直居中排版
        document.body.classList.add('p-4', 'md:p-8'); // 增加后台的边距排版
        loadAdminMusicList();
    };
    
    const showLogin = () => {
        adminSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.body.classList.add('items-center');
        document.body.classList.remove('p-4', 'md:p-8');
    };

    // 第一步：一进页面先检查 Cookie 验证状态
    try {
        const res = await fetch('auth.php?action=check');
        const json = await res.json();
        if (json.status === 'success' && json.is_logged_in) {
            showAdmin(); // 鉴权成功，直接展示后台
        } else {
            showLogin(); // 未登录，展示登录框
        }
    } catch (err) {
        showLogin();
        document.getElementById('loginStatus').innerHTML = '<span class="text-red-400">鉴权接口离线</span>';
    }

    // 处理表单登录
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const status = document.getElementById('loginStatus');
        const btn = loginForm.querySelector('button');
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 验证中...';
        btn.disabled = true;

        try {
            const res = await fetch('auth.php?action=login', { method: 'POST', body: new FormData(loginForm) });
            const json = await res.json();
            if (json.status === 'success') {
                status.innerHTML = `<span class="text-green-400">密钥正确，建立连接...</span>`;
                setTimeout(() => { 
                    status.innerHTML = '';
                    loginForm.reset();
                    showAdmin(); // 核心：登录成功直接切换UI模块，不跳转！
                }, 800);
            } else {
                status.innerHTML = `<span class="text-red-400">${json.message}</span>`;
            }
        } catch (err) {
            status.innerHTML = `<span class="text-red-400">服务器无响应</span>`;
        } finally {
            btn.innerHTML = '验 证 身 份';
            btn.disabled = false;
        }
    };

    // 退出登录绑定
    document.getElementById('logoutBtn').onclick = async () => {
        await fetch('auth.php?action=logout');
        showLogin(); // 退出后直接将界面切回登录框，不跳转！
    };

    // 文件上传交互绑定
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileNameDisplay.innerHTML = `<span class="text-blue-300 font-bold">${this.files[0].name}</span>`;
        } else {
            fileNameDisplay.innerHTML = '点击此处选择音频文件';
        }
    });

    // 发布音频绑定
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.onsubmit = async function(e) {
        e.preventDefault();
        if(!fileInput.files.length) return alert('请装载音频文件！');

        const statusDiv = document.getElementById('uploadStatus');
        const submitBtn = document.getElementById('submitBtn');
        const originalHtml = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>上传中...';
        statusDiv.innerHTML = '<span class="text-blue-300">正在传输至云端...</span>';

        try {
            const res = await fetch('upload.php', { method: 'POST', body: new FormData(this) });
            const result = await res.json();
            
            if (result.status === 'success') {
                statusDiv.innerHTML = `<span class="text-green-400"><i class="fa fa-check mr-1"></i>发布成功</span>`;
                uploadForm.reset();
                fileNameDisplay.innerHTML = '点击此处选择音频文件';
                loadAdminMusicList();
            } else {
                statusDiv.innerHTML = `<span class="text-red-400">${result.message}</span>`;
                if(result.message.includes('登录')) showLogin(); // 如果后端报权限错误，踢回登录界面
            }
        } catch (err) {
            statusDiv.innerHTML = '<span class="text-red-400">传输中断</span>';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
            setTimeout(() => { statusDiv.innerHTML = ''; }, 3000);
        }
    };
}

// 加载后台音频列表
async function loadAdminMusicList() {
    const listContainer = document.getElementById('adminMusicList');
    listContainer.innerHTML = '<div class="text-center text-blue-300 py-10"><i class="fa fa-spinner fa-spin fa-2x"></i></div>';
    try {
        const res = await fetch('list.php');
        const json = await res.json();
        if (json.status === 'success') {
            if (json.data.length === 0) {
                listContainer.innerHTML = '<div class="text-center text-gray-400 py-10">库内空空如也</div>';
                return;
            }
            listContainer.innerHTML = json.data.map(item => `
                <div class="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                    <div class="flex items-center space-x-4 overflow-hidden">
                        <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-300 shrink-0">
                            <i class="fa fa-music"></i>
                        </div>
                        <div class="truncate">
                            <p class="text-sm font-medium text-gray-200 truncate" title="${item.name}">${item.name}</p>
                            <p class="text-[11px] text-gray-500 mt-1">${item.date}</p>
                        </div>
                    </div>
                    <button onclick="deleteMusic('${item.filename}')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all shrink-0">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    } catch (err) {
        listContainer.innerHTML = '<div class="text-center text-red-400 py-4">数据列阵崩溃</div>';
    }
}

// 暴露方法给 HTML 内部事件使用
window.loadAdminMusicList = loadAdminMusicList;
window.deleteMusic = async function(filename) {
    if (!confirm(`警告: 确定要永久销毁《${filename}》吗？`)) return;
    const formData = new FormData();
    formData.append('filename', filename);
    try {
        const res = await fetch('delete.php', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.status === 'success') {
            loadAdminMusicList();
        } else {
            alert(json.message);
            if(json.message.includes('登录')) location.reload(); 
        }
    } catch (err) {
        alert('核心连接失败');
    }
};

// ============ 路由分配枢纽 ============
document.addEventListener('DOMContentLoaded', () => {
    // 依靠 body 绑定的 id 来决定启动什么脚本
    if (document.getElementById('page-index')) {
        initClient();
    } else if (document.getElementById('page-admin-merged')) {
        initAdminMerged();
    }
});