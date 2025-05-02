<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h3 style="margin-top: 0">
        {{ localStory.id ? "Редактировать историю" : "Новая история" }}
      </h3>
      <form @submit.prevent="saveStory">
        <div class="form-group">
          <label>Название</label>
          <input v-model="localStory.title" required />
        </div>

        <div class="form-group">
          <label>Статус</label>
          <select v-model="localStory.status" required>
            <option value="todo">To Do</option>
            <option value="progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div class="form-group">
          <label>Приоритет</label>
          <select v-model="localStory.priority">
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>

        <div class="form-group">
          <label>Исполнитель</label>
          <select v-model="localStory.assignee">
            <option disabled value="">-- выберите --</option>
            <option
              v-for="member in projectMembers"
              :key="member.userId"
              :value="member.userId"
            >
              {{ getUserName(member.userId) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="localStory.description" rows="3" />
        </div>
        <div class="form-group">
          <label>Дата создания</label>
          <input
            type="text"
            :value="formatFullDate(localStory.createdAt)"
            disabled
          />
          <!-- type="datetime-local" -->
        </div>
        <div class="form-group">
          <label>Дата закрытия</label>
          <input
            type="text"
            :value="formatFullDate(localStory.closedAt)"
            disabled
          />
          <!-- type="datetime-local" -->
        </div>

        <div class="form-group">
          <label>Дедлайн</label>
          <input type="date" v-model="localStory.endDate" />
        </div>

        <!-- Комментарии -->
        <div class="comments-section">
          <h4>Комментарии</h4>

          <QuillEditor
            v-model:content="commentContent"
            :contentType="'html'"
            :theme="'snow'"
            style="height: 100px"
          />

          <div class="file-upload">
            <input type="file" @change="handleFileUpload" class="add-file" />
          </div>

          <button type="button" @click="addComment" class="add-comment-btn">
            Добавить комментарий
          </button>

          <div style="max-height: 600px; overflow-y: auto">
            <div
              class="comment-item"
              v-for="comment in localStory.comments"
              :key="comment.id"
            >
              <div class="comment-meta">
                <span class="comment">{{ getUserName(comment.userId) }}</span>
                <span class="comment">{{
                  formatFullDate(comment.createdAt)
                }}</span>
              </div>
              <div v-html="comment.content" class="comment-content"></div>
              <div v-if="comment.files.length">
                <div v-for="file in comment.files" :key="file.name">
                  <a :href="file.url" target="_blank">{{ file.name }}</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')">Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import { generateId } from "@/utils/id";

export default {
  name: "EditStoryModal",
  components: { QuillEditor },
  props: ["story", "projectMembers"],
  data() {
    return {
      commentContent: "",
      newFiles: [],
      localStory: {
        ...this.story,
        status: "todo",
        priority: "medium",
        comments: this.story.comments ? [...this.story.comments] : [],
      },
    };
  },
  watch: {
    story: {
      immediate: true,
      handler(newStory) {
        this.localStory = {
          status: "todo",
          priority: "medium",
          createdAt: new Date().toISOString(),
          ...newStory,
          comments: newStory?.comments ? [...newStory.comments] : [],
        };
      },
    },
  },
  methods: {
    async saveStory() {
      const isNew = !this.localStory.id;

      if (isNew) {
        this.localStory.id = generateId();
        this.localStory.createdAt = new Date().toISOString();
        this.localStory.closedAt =
          this.localStory.status === "done" ? new Date().toISOString() : null;
      }

      const releaseId = this.$parent.editingReleaseId;
      const taskPath = this.$parent.editingTaskPath;

      try {
        const action = isNew ? "addStory" : "updateStory";

        await this.$store.dispatch(`releases/${action}`, {
          releaseId,
          taskPath,
          story: this.localStory,
        });

        this.$emit("close");
      } catch (err) {
        console.error("Ошибка при сохранении истории:", err);
        alert("Не удалось сохранить историю");
      }
    },
    getUserName(userId) {
      return (
        this.$store.getters["users/getUserById"](userId)?.name || "Неизвестный"
      );
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString("ru-RU") : "—";
    },
    formatFullDate(date) {
      if (!date) return "—";
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, "0");

      return (
        `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
        `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
      );
    },
    addComment() {
      console.log("Что приходит из редактора:", this.commentContent);
      const cleanText = this.stripHtml(this.commentContent).trim();
      if (!cleanText) {
        alert("Комментарий не может быть пустым!");
        return;
      }
      this.localStory.comments.push({
        id: generateId(),
        content: this.commentContent,
        createdAt: new Date().toISOString(),
        files: [...this.newFiles],
        userId: this.$store.state.auth.user?.id,
      });
      this.commentContent = ""; 
      this.newFiles = [];
    },
    stripHtml(html) {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.newFiles.push({
          name: file.name,
          url: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100vh;
  /* background: rgba(0, 0, 0, 0.4); */
  z-index: 1000;
}

.modal {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 96vh;
  background: #fff;
  padding: 20px;
  overflow-y: auto;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}

.form-group {
  display: flex;
  margin-bottom: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 25px;
  margin-top: 0;
}

label {
  display: block;
  align-self: center;
  margin-bottom: 8px;
  color: #7f8c8d;
  font-weight: 500;
  width: 50%;
  margin: 0;
  font-size: 1.1rem;
}

input,
textarea,
select {
  width: 100%;
  border: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

textarea {
  height: 50px;
  resize: vertical;
}

.user-list {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
  padding: 4px;
  padding-left: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-item select {
  margin-left: auto;
  padding: 6px 12px;
  border-radius: 4px;
  border: 0;
  background: #f4f4f4;
}
.delete-btn {
  background: #e74c3c;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
}
.access-warning {
  color: #e74c3c;
  padding: 15px;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  margin-top: 20px;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 35px;
  margin-top: 25px;
}

.modal-actions button {
  flex: 1;
  padding: 12px 25px;
  border-radius: 6px;
  border: 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s;
}

.modal-actions button[type="button"] {
  background: #e74c3c;
  color: white;
}

.modal-actions button[type="submit"] {
  background: #2ecc71;
  color: white;
}

.modal-actions button[type="button"]:hover {
  background: #f8301a;
}

.modal-actions button[type="submit"]:hover {
  background: #23ec77;
}

.comments-section {
  margin-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.add-comment-btn {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.add-comment-btn:hover {
  background-color: #2980b9;
}

.comment-item {
  margin-top: 15px;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
}

.comment-content {
  margin-top: 5px;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment {
  font-size: 12px;
  color: #888;
}

.add-file {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.3s;
}

.add-file:hover {
  opacity: 0.9;
}

.add-file[type="submit"] {
  background: #3498db;
  color: white;
}
</style>
