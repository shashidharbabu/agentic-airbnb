import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name] && name !== 'general') {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== LOGIN FORM SUBMITTED ===');
    console.log('Form submitted with data:', formData);
    console.log('Event:', e);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Starting login process...');
    setLoading(true);
    
    try {
      console.log('Calling login function with:', { email: formData.email, password: '***' });
      const result = await login(formData.email, formData.password);
      console.log('Login function returned:', result);
      
      if (result.success) {
        console.log('Login successful, navigating...');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        console.log('=== LOGIN FAILED ===');
        console.log('Login failed, setting error:', result.error);
        console.log('Setting errors state to:', { general: result.error });
        setErrors({ general: result.error });
        console.log('Error set, current errors state:', errors);
        setTimeout(() => {
          console.log('Clearing error after 10 seconds');
          setErrors(prev => ({
            ...prev,
            general: ''
          }));
        }, 10000);
      }
    } catch (error) {
      console.log('=== LOGIN CATCH ERROR ===');
      console.log('Caught error:', error);
      setErrors({ general: 'An unexpected error occurred' });
      setTimeout(() => {
        setErrors(prev => ({
          ...prev,
          general: ''
        }));
      }, 10000);
    } finally {
      console.log('=== LOGIN FINALLY ===');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{errors.general}</span>
                <button 
                  type="button" 
                  onClick={() => setErrors(prev => ({ ...prev, general: '' }))}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'inherit', 
                    fontSize: '18px', 
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px'
                  }}
                  aria-label="Close error"
                >
                  ×
                </button>
              </div>
            )}
            {console.log('Current errors state:', errors)}
            {console.log('Should show error?', !!errors.general)}
            {console.log('Error message:', errors.general)}


            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <div className="invalid-feedback">
                  {errors.email}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
              />
              {errors.password && (
                <div className="invalid-feedback">
                  {errors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .auth-header {
          padding: 40px 40px 20px;
          text-align: center;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }

        .auth-subtitle {
          color: #666;
          font-size: 1rem;
        }

        .auth-form {
          padding: 0 40px 20px;
        }

        .auth-footer {
          padding: 20px 40px 40px;
          text-align: center;
          background: #f8f9fa;
        }

        .auth-link {
          color: #FF385C;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-link:hover {
          text-decoration: underline;
        }

        .w-100 {
          width: 100%;
        }

        @media (max-width: 480px) {
          .auth-header,
          .auth-form,
          .auth-footer {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
