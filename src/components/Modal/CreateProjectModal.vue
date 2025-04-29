<template>
  <div class="modal-overlay">
    <div class="modal">
      <h2 style="margin-bottom: 20px;">Создать новый проект</h2>
      <form @submit.prevent="handleSubmit"> 
        <!-- Название проекта -->
        <div class="form-group">
          <label>Название проекта:</label>
          <input 
            v-model="form.name"
            placeholder="Введите название"
            :class="{ 'input-error': errors.name }"
            class="dady"
            required
          />
        </div>

        <!-- Выбор организации -->
        <div class="form-group">
          <label>Организация:</label>
          <select class="dady" v-model="selectedOrg" required :disabled="!userOrgs.length">
            <option v-for="org in userOrgs" :value="org.id" :key="org.id">
              {{ org.name }}
            </option>
          </select>
          <p v-if="!userOrgs.length" class="error-text">
            Сначала создайте организацию в профиле
          </p>
        </div>

        <!-- Участники из организации -->
        <div class="group" v-if="orgMembers.length">
          <label style="    margin-bottom: 10px;color: #2c3e50;font-weight: 600;">Участники</label>
          <div class="members-list">
            <div
              v-for="member in orgMembers"
              :key="member.userId"
              class="member-card"
              :class="{ selected: selectedMembers.includes(member.userId) }"
              @click="toggleMember(member.userId)"
            >
              {{ getUserName(member.userId) }}
            </div>
          </div>
        </div>

        <!-- Кнопки -->
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? "Создание..." : "Создать проект" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { generateId } from "@/utils/id";

export default {
  data() {
    return {
      form: {
        name: "",
        description: "",
        deadline: "",
      },
      selectedOrg: null,
      selectedMembers: [],
      errors: {},
      isSubmitting: false,
    };
  },
  computed: {
    orgMembers() {
      if (!this.selectedOrg) return [];
      const org = this.$store.state.organizations.organizations.find(
        (o) => o.id === this.selectedOrg
      );
      return org?.members || [];
    },
    userOrgs() {
      return this.$store.getters["organizations/userOrganizations"] || [];
    },
  },
  methods: {
    getUserName(userId) {
      const user = this.$store.state.auth.users.find((u) => u.id === userId);
      return user?.name || "Неизвестный";
    },
    toggleMember(userId) {
      const index = this.selectedMembers.indexOf(userId);
      if (index === -1) {
        this.selectedMembers.push(userId);
      } else {
        this.selectedMembers.splice(index, 1);
      }
    },
    async handleSubmit() {
      try {
        const creatorId = this.$store.state.auth.user.id;
        this.$store.commit("organizations/ADD_MEMBER", {
          orgId: this.selectedOrg,
          userId: creatorId,
          role: "admin",
        });

        const members = this.selectedMembers.map((userId) => {
          const user = this.$store.state.auth.users.find(
            (u) => u.id === userId
          );

          const orgMember = this.$store.state.organizations.members.find(
            (m) => m.orgId === this.selectedOrg && m.userId === userId
          );

          return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: orgMember?.role || "member",
          };
        });

        if (!members.some((m) => m.userId === creatorId)) {
          const creator = this.$store.state.auth.user;
          const orgMember = this.$store.state.organizations.members.find(
            (m) => m.orgId === this.selectedOrg && m.userId === creatorId
          );

          members.push({
            userId: creator.id,
            name: creator.name,
            email: creator.email,
            role: orgMember?.role || "admin",
          });
        }

        const project = {
          id: generateId(),
          name: this.form.name,
          description: this.form.description,
          deadline: this.form.deadline,
          orgId: this.selectedOrg,
          creatorId,
          members,
          activities: [],
        };

        this.$store.commit("projects/ADD_PROJECT", project);
        this.$emit("close");
      } catch (error) {
        console.error("Ошибка:", error);
        alert("Не удалось создать проект");
      }
    },
  },
};
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

.group{
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.members-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.member-card {
  padding: 8px 12px;
  background: #e1e1e1;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
  position: relative;
}

.member-card.selected {
  background: #3498db;
  color: white;
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

.dady {
  width: 50%;
  border: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

input:invalid {
  border-color: #e74c3c;
}
</style>