<template>
  <div class="register">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Имя:</label>
        <input v-model="form.name" required />
      </div>

      <div class="form-group">
        <label>Email:</label>
        <input v-model="form.email" type="email" required />
      </div>

      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </div>

      <button type="submit">Зарегистрироваться</button>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: "",
        email: "",
        password: ""
      },
      error: null
    };
  },
  methods: {
    async handleSubmit() {
      this.error = null;
      try {
        await this.$store.dispatch("auth/register", {
          name: this.form.name,
          email: this.form.email,
          password: this.form.password
        });
        this.$router.push("/");
      } catch (err) {
        this.error = err.message || "Ошибка регистрации";
      }
    }
  }
};
</script>

<style scoped>
.register {
  max-width: 400px;
  margin: 50px auto;
  padding: 40px;
  background: #fff;
  box-shadow: -3px 4px 1px 0px rgba(34, 60, 80, 0.2);
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 500;
  color: #2d3748;
  font-size: 0.9rem;
}

input {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

button[type="submit"] {
  background: #48bb78;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

button[type="submit"]:hover {
  background: #38a169;
}

button[type="submit"]:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.error {
  padding: 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 6px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.error::before {
  content: "⚠️";
}

@media (max-width: 480px) {
  .register {
    margin: 20px;
    padding: 24px;
  }
  
  input {
    padding: 10px 14px;
  }
}
</style>