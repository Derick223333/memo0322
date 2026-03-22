// 1. Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBDjy2-FS6w7KDaVECueKyXYW7j0JFYn30",
  authDomain: "memo-5b239.firebaseapp.com",
  projectId: "memo-5b239",
  storageBucket: "memo-5b239.firebasestorage.app",
  messagingSenderId: "511725830737",
  appId: "1:511725830737:web:a4a7a8fbf6655df223ee70",
  measurementId: "G-FZTYQ6TR23"
};

// 초기화
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const storage = firebase.storage();

// DOM 참조
const memoForm = document.getElementById('memo-form');
const memoInput = document.getElementById('memo-input');
const fileInput = document.getElementById('file-input');
const memoList = document.getElementById('memo-list');
const submitBtn = document.getElementById('submit-btn');

let isEditMode = false;
let editId = null;

// [READ] 실시간 메모 불러오기
db.collection("memos").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
  memoList.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.className = "memo-item";
    li.innerHTML = `
      <div class="content">${data.content}</div>
      ${data.fileUrl ? `<div class="attachment">📎 <a href="${data.fileUrl}" target="_blank">첨부파일 확인</a></div>` : ''}
      <div class="actions">
        <button onclick="editMemo('${doc.id}', \`${data.content}\`)">수정</button>
        <button onclick="deleteMemo('${doc.id}', '${data.fileUrl || ''}')">삭제</button>
      </div>
    `;
    memoList.appendChild(li);
  });
});

// [CREATE & UPDATE] 메모 저장 로직
memoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = memoInput.value;
  const file = fileInput.files[0];
  let fileUrl = "";

  submitBtn.disabled = true;
  submitBtn.innerText = "처리 중...";

  try {
    // 파일 업로드 (선택사항)
    if (file) {
      const storageRef = storage.ref(`memos/${Date.now()}_${file.name}`);
      const snapshot = await storageRef.put(file);
      fileUrl = await snapshot.ref.getDownloadURL();
    }

    if (isEditMode) {
      // 수정 업데이트
      const updateData = { content, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      if (fileUrl) updateData.fileUrl = fileUrl;
      await db.collection("memos").doc(editId).update(updateData);
    } else {
      // 신규 추가
      await db.collection("memos").add({
        content,
        fileUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    resetForm();
  } catch (error) {
    console.error(error);
    alert("오류가 발생했습니다.");
  } finally {
    submitBtn.disabled = false;
  }
});

// [DELETE] 삭제 함수
window.deleteMemo = async (id, fileUrl) => {
  if (confirm("삭제하시겠습니까?")) {
    try {
      await db.collection("memos").doc(id).delete();
      if (fileUrl) {
        await storage.refFromURL(fileUrl).delete();
      }
    } catch (err) {
      console.error("삭제 실패:", err);
    }
  }
};

// [EDIT] 수정 모드 진입
window.editMemo = (id, content) => {
  memoInput.value = content;
  isEditMode = true;
  editId = id;
  submitBtn.innerText = "수정 완료";
  memoInput.focus();
};

function resetForm() {
  memoInput.value = "";
  fileInput.value = "";
  isEditMode = false;
  editId = null;
  submitBtn.innerText = "메모 저장";
}
