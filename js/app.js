/**
 * 清掃シフト自動化システム - メインJavaScript
 */

// 画面切り替え機能
function showScreen(screenId) {
    // すべての画面を非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 指定した画面を表示
    document.getElementById(screenId).classList.add('active');
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('清掃シフト自動化システムが読み込まれました');
    
    // メニューアイテムのホバー効果を追加
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// 将来的な機能拡張用の関数
function initializeCalendar() {
    // カレンダー機能の初期化
    console.log('カレンダー機能を初期化中...');
}

function initializeSchedule() {
    // スケジュール機能の初期化
    console.log('スケジュール機能を初期化中...');
}

function initializeStaff() {
    // スタッフ管理機能の初期化
    console.log('スタッフ管理機能を初期化中...');
} 