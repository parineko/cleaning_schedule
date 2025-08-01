/**
 * Beds24→清掃シフト自動化システム
 * Google Apps Script メインファイル
 */

// 設定
const CONFIG = {
  BEDS24_API_URL: 'https://api.beds24.com/json/',
  BEDS24_AUTHENTICATION_TOKEN: 'YOUR_AUTH_TOKEN', // 実際のトークンに置き換え
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // 実際のスプレッドシートIDに置き換え
  PROPERTY_ID: 'YOUR_PROPERTY_ID' // 実際のプロパティIDに置き換え
};

/**
 * メイン実行関数
 */
function main() {
  try {
    console.log('清掃シフト自動化システムを開始します...');
    
    // Beds24から予約データを取得
    const reservations = getBeds24Reservations();
    
    // スプレッドシートを取得
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // 部屋稼働カレンダーを更新
    updateRoomCalendar(spreadsheet, reservations);
    
    // 清掃スケジュールを更新
    updateCleaningSchedule(spreadsheet, reservations);
    
    console.log('処理が完了しました');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

/**
 * Beds24 APIから予約データを取得
 */
function getBeds24Reservations() {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 7); // 1週間後まで
  
  const payload = {
    authentication: {
      authenticationToken: CONFIG.BEDS24_AUTHENTICATION_TOKEN
    },
    getReservations: {
      includeInactive: false,
      arrivalDate: formatDate(today),
      departureDate: formatDate(endDate),
      propertyId: CONFIG.PROPERTY_ID
    }
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };
  
  const response = UrlFetchApp.fetch(CONFIG.BEDS24_API_URL, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.error) {
    throw new Error('Beds24 API エラー: ' + data.error);
  }
  
  return data.data || [];
}

/**
 * 部屋稼働カレンダーを更新
 */
function updateRoomCalendar(spreadsheet, reservations) {
  const sheet = spreadsheet.getSheetByName('部屋稼働カレンダー');
  if (!sheet) {
    console.log('部屋稼働カレンダーシートが見つかりません');
    return;
  }
  
  // ヘッダー行を設定
  const headers = ['部屋'];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    headers.push(formatDateForHeader(date));
  }
  
  // 部屋リスト（実際の部屋番号に置き換え）
  const rooms = ['101', '102', '103', '201', '202', '203', '301', '302', '401'];
  
  // データを準備
  const data = [];
  data.push(headers);
  
  rooms.forEach(room => {
    const row = [room];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = formatDate(date);
      
      // その日の予約を検索
      const dayReservations = reservations.filter(res => 
        res.arrivalDate <= dateStr && res.departureDate > dateStr
      );
      
      const roomReservation = dayReservations.find(res => res.roomId === room);
      
      if (roomReservation) {
        if (roomReservation.departureDate === dateStr) {
          // チェックアウト日
          let status = `OUT ${roomReservation.departureTime || '11:00'}\n清掃予定`;
          
          // 同日チェックインがあるかチェック
          const sameDayCheckin = reservations.find(res => 
            res.roomId === room && res.arrivalDate === dateStr
          );
          if (sameDayCheckin) {
            status += `\nIN ${sameDayCheckin.arrivalTime || '15:00'}`;
          }
          
          row.push(status);
        } else if (roomReservation.arrivalDate === dateStr) {
          // チェックイン日
          row.push(`IN ${roomReservation.arrivalTime || '15:00'}`);
        } else {
          // 宿泊中 - 連泊客の清掃要否をチェック
          const isStayingGuestNeedingCleaning = checkIfStayingGuestNeedsCleaning(roomReservation, dateStr);
          if (isStayingGuestNeedingCleaning) {
            row.push('宿泊中(清掃要)');
          } else {
            row.push('宿泊中');
          }
        }
      } else {
        // 空室
        row.push('空室');
      }
    }
    
    data.push(row);
  });
  
  // シートをクリアして新しいデータを設定
  sheet.clear();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // スタイルを適用
  applyCalendarStyles(sheet, data.length, data[0].length);
}

/**
 * 清掃スケジュールを更新
 */
function updateCleaningSchedule(spreadsheet, reservations) {
  const sheet = spreadsheet.getSheetByName('清掃スケジュール');
  if (!sheet) {
    console.log('清掃スケジュールシートが見つかりません');
    return;
  }
  
  // スタッフ情報（実際のスタッフ情報に置き換え）
  const staff = [
    { name: '田中太郎', workDays: ['月', '火', '水', '木', '金'], startTime: '09:00', endTime: '17:00' },
    { name: '佐藤花子', workDays: ['火', '水', '木', '金', '土'], startTime: '10:00', endTime: '18:00' },
    { name: '山田次郎', workDays: ['月', '水', '金'], startTime: '08:00', endTime: '16:00' },
    { name: '鈴木美咲', workDays: ['土', '日'], startTime: '13:00', endTime: '19:00' }
  ];
  
  // ヘッダー行を設定
  const headers = ['スタッフ'];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    headers.push(formatDateForHeader(date));
  }
  
  const data = [];
  data.push(headers);
  
  // スタッフごとのデータを生成
  staff.forEach(s => {
    const row = [`${s.name}\n${s.startTime}-${s.endTime}`];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = formatDate(date);
      const dayOfWeek = getDayOfWeek(date);
      
      if (s.workDays.includes(dayOfWeek)) {
        // その日の清掃予定を検索（チェックアウト + 連泊客の清掃）
        const checkoutTasks = reservations.filter(res => 
          res.departureDate === dateStr
        );
        
        const stayingGuestTasks = reservations.filter(res => {
          const isStayingGuestNeedingCleaning = checkIfStayingGuestNeedsCleaning(res, dateStr);
          return isStayingGuestNeedingCleaning;
        });
        
        const allCleaningTasks = [...checkoutTasks, ...stayingGuestTasks];
        
        if (allCleaningTasks.length > 0) {
          // 時間的重複を避けた清掃予定の割り当て
          const assignedTasks = assignCleaningTasks(s, allCleaningTasks, i);
          if (assignedTasks.length > 0) {
            const taskText = assignedTasks.map(task => 
              `${task.startTime}-${task.endTime} ${task.roomId}号室`
            ).join('\n');
            row.push(taskText);
          } else {
            row.push('空き');
          }
        } else {
          row.push('空き');
        }
      } else {
        row.push('休み');
      }
    }
    
    data.push(row);
  });
  
  // シートをクリアして新しいデータを設定
  sheet.clear();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  // スタイルを適用
  applyScheduleStyles(sheet, data.length, data[0].length);
}

/**
 * カレンダーのスタイルを適用
 */
function applyCalendarStyles(sheet, rows, cols) {
  // ヘッダー行のスタイル
  const headerRange = sheet.getRange(1, 1, 1, cols);
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // 部屋列のスタイル
  const roomRange = sheet.getRange(2, 1, rows - 1, 1);
  roomRange.setBackground('#f0f4ff');
  roomRange.setFontWeight('bold');
  
  // 境界線を設定
  sheet.getRange(1, 1, rows, cols).setBorder(true, true, true, true, true, true);
}

/**
 * スケジュールのスタイルを適用
 */
function applyScheduleStyles(sheet, rows, cols) {
  // ヘッダー行のスタイル
  const headerRange = sheet.getRange(1, 1, 1, cols);
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // 日付列のスタイル
  const dateRange = sheet.getRange(2, 1, rows - 1, 1);
  dateRange.setBackground('#f0f4ff');
  dateRange.setFontWeight('bold');
  
  // 境界線を設定
  sheet.getRange(1, 1, rows, cols).setBorder(true, true, true, true, true, true);
}

/**
 * 日付をフォーマット（YYYY-MM-DD）
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * ヘッダー用の日付フォーマット（M/d(曜日)）
 */
function formatDateForHeader(date) {
  const dayOfWeek = getDayOfWeek(date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}(${dayOfWeek})`;
}

/**
 * 曜日を取得
 */
function getDayOfWeek(date) {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

/**
 * 連泊客が清掃を必要とするかチェック
 */
function checkIfStayingGuestNeedsCleaning(reservation, dateStr) {
  // 連泊3日以上の場合、2日目以降に清掃が必要
  const arrivalDate = new Date(reservation.arrivalDate);
  const currentDate = new Date(dateStr);
  const daysStaying = Math.floor((currentDate - arrivalDate) / (1000 * 60 * 60 * 24));
  
  // 2日目以降で、3日以上の連泊の場合に清掃が必要
  return daysStaying >= 1 && 
         (new Date(reservation.departureDate) - arrivalDate) / (1000 * 60 * 60 * 24) >= 3;
}

/**
 * 時間的重複を避けて清掃タスクを割り当て
 */
function assignCleaningTasks(staff, cleaningTasks, dayIndex) {
  const assignedTasks = [];
  const staffStartHour = parseInt(staff.startTime.split(':')[0]);
  const staffEndHour = parseInt(staff.endTime.split(':')[0]);
  const availableHours = staffEndHour - staffStartHour;
  
  // 各タスクに時間枠を割り当て（1タスクあたり1.5時間と仮定）
  let currentHour = staffStartHour;
  
  cleaningTasks.forEach((task, index) => {
    if (currentHour + 1.5 <= staffEndHour) {
      const startTime = `${String(currentHour).padStart(2, '0')}:00`;
      const endTime = `${String(currentHour + 1.5).padStart(2, '0')}:30`;
      
      assignedTasks.push({
        roomId: task.roomId,
        startTime: startTime,
        endTime: endTime
      });
      
      currentHour += 1.5;
    }
  });
  
  return assignedTasks;
}

/**
 * 定期実行用の関数（毎日午前9時に実行）
 */
function dailyUpdate() {
  main();
}

/**
 * 手動実行用の関数
 */
function manualUpdate() {
  main();
} 