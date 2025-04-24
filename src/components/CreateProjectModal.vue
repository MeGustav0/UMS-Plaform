<template>
  <div class="modal-overlay">
    <div class="modal">
      <h2>Создать новый проект</h2>
      <form @submit.prevent="handleSubmit">
        <!-- Название проекта -->
        <div class="form-group">
          <label>Название проекта:</label>
          <input
            v-model="form.name"
            placeholder="Введите название"
            :class="{ 'input-error': errors.name }"
          >
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label>Организация:</label>
          <select v-model="selectedOrg">
            <option 
              v-for="org in userOrgs" 
              :value="org.orgId"
              :key="org.orgId"
            >
              {{ getOrgName(org.orgId) }}
            </option>
          </select>
        </div>
        <!-- Описание -->
        <div class="form-group">
          <label>Описание:</label>
          <textarea
            v-model="form.description"
            placeholder="Добавьте описание проекта"
          ></textarea>
        </div>

        <!-- Участники и роли -->
        <div class="form-group">
          <label>Участники:</label>
          <div class="members-list">
            <div 
              v-for="(member, index) in members"
              :key="index"
              class="member-row"
            >
              <input
                v-model="member.email"
                placeholder="Email участника"
                :class="{ 'input-error': errors[`member-${index}`] }"
              >
              <select v-model="member.role">
                <option value="manager">Менеджер</option>
                <option value="member">Исполнитель</option>
              </select>
              <button 
                type="button" 
                class="remove-btn"
                @click="removeMember(index)"
              >×</button>
            </div>
            <button 
              type="button" 
              class="add-member-btn"
              @click="addMember"
            >+ Добавить участника</button>
          </div>
          <span v-if="errors.members" class="error-text">{{ errors.members }}</span>
        </div>

        <!-- Дедлайн -->
        <div class="form-group">
          <label>Дедлайн:</label>
          <input
            type="date"
            v-model="form.deadline"
            :min="new Date().toISOString().split('T')[0]"
          >
        </div>

        <!-- Кнопки -->
        <div class="modal-actions">
          <button 
            type="button" 
            class="cancel-btn"
            @click="$emit('close')"
          >Отмена</button>
          <button 
            type="submit" 
            class="submit-btn"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Создание...' : 'Создать проект' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: '',
        description: '',
        deadline: ''
      },
      members: [],
      errors: {},
      isSubmitting: false
    }
  },
  computed: {
    allUsers() {
      return this.$store.state.auth.users || []
    },
    userOrgs() {
      return this.$store.state.auth.user.organizations
    }
  },
  methods: {
    // Добавление участника
    addMember() {
      this.members.push({ email: '', role: 'member' })
    },
    // Удаление участника
    removeMember(index) {
      this.members.splice(index, 1)
    },
    // Валидация email
    validateMember(email) {
      const exists = this.$store.state.auth.users.some(u => u.email === email)
      return exists ? true : 'Пользователь не найден'
    },
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    getOrgName(orgId) {
      return this.$store.state.organizations.organizations
        .find(o => o.id === orgId)?.name
    },
    // Проверка формы
    validateForm() {
      this.errors = {}
      let isValid = true

      // Проверка названия
      if (!this.form.name.trim()) {
        this.errors.name = 'Обязательное поле'
        isValid = false
      }

      // Проверка участников
      this.members.forEach((member, index) => {
        if (!member.email) return
        if (!this.validateEmail(member.email)) {
          this.errors[`member-${index}`] = 'Некорректный email'
          isValid = false
        }
        
        const userExists = this.allUsers.some(u => u.email === member.email)
        if (!userExists) {
          this.errors[`member-${index}`] = 'Пользователь не найден'
          isValid = false
        }
      });
      this.members.forEach((member, index) => {
        if (member.email === this.$store.state.auth.user?.email) {
          this.errors[`member-${index}`] = "Вы не можете изменять свою роль";
          isValid = false;
        }
      });

      return isValid
    },

    // Создание проекта
    handleSubmit() {
    try {
      // Проверка email участников
      const invalidEmails = this.form.members
        .split(',')
        .map(e => e.trim())
        .filter(e => e && !this.validateEmail(e));

      if (invalidEmails.length > 0) {
        throw new Error(`Некорректные email: ${invalidEmails.join(', ')}`);
      }

      // Создание проекта
      const project = {
        ...this.form,
        id: Date.now(),
        orgId: this.selectedOrgId,
        members: this.form.members
          .split(',')
          .filter(e => e.trim())
          .map(email => ({
            email: email.trim(),
            role: 'member'
          }))
      };

      this.$store.commit('projects/ADD_PROJECT', project);
      this.$emit('close');

    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      alert(error.message);
    }
  }
  }
}
</script>


<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 100;
}

.modal {
  margin-top: 20vh;
  margin-left: auto;
  margin-right: auto;
  background: #f8f7f7;
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  min-width: 400px;
  box-shadow: 0px 7px 20px 0px rgba(34, 60, 80, 0.2);
}

h2 {
  color: #2c3e50;
  margin-bottom: 25px;
  margin-top: 0;
}

.form-group {
  display: flex;
  margin-bottom: 20px;
}

label {
  display: block;
  align-self: center;
  color: #7f8c8d;
  font-weight: 500;
  width: 50%;
  margin: 0;
  font-size: 1.1rem;
}

input, textarea {
  width: 100%;
  border: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

textarea {
  height: 80px;
  resize: vertical;
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
  border: 2px solid #5c5f5f;
  cursor: pointer;
  font-weight: 600;
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
input:invalid {
  border-color: #e74c3c;
}
</style>