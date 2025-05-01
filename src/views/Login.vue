<template>
  <div class="login-page">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>

      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="password" type="password" required />
      </div>

      <div class="auth-links">
        <button type="submit" class="login-btn">Войти</button>
        <router-link to="/register" class="register-link">
          Или зарегистрироваться
        </router-link>
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: "",
      password: "",
      error: null
    };
  },
  methods: {
    async handleSubmit() {
      this.error = null;
      try {
        await this.$store.dispatch("auth/login", {
          email: this.email,
          password: this.password
        });
        this.$router.push("/");
      } catch (err) {
        this.error = err.message || "Ошибка входа";
      }
    }
  }
};
</script>

<style scoped>
.login-page {
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

.auth-links {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-top: 1rem;
}

.login-btn {
  background: #4299e1;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover {
  background: #3182ce;
}

.login-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  color: #4299e1;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.register-link:hover {
  color: #3182ce;
  text-decoration: underline;
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
  .login-page {
    margin: 20px;
    padding: 24px;
  }
  
  input {
    padding: 10px 14px;
  }
}
</style>