import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isWechatMiniProgram } from '../../utils/environment';
import SvgIcon from '../../components/common/SvgIcons';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    avatar: '',
    userCode: userid || '',
    userType: '普通用户',
    isMember: false,
    memberExpireDate: null
  });
  const [orderType, setOrderType] = useState('online'); // 'online' 或 'store'

  // 检查是否为小程序环境
  const isMiniProgram = isWechatMiniProgram();

  useEffect(() => {
    if (userid) {
      loadUserInfo();
    }
  }, [userid]);

  // 加载用户信息
  const loadUserInfo = async () => {
    try {
      // 这里可以调用API获取用户信息
      // 暂时使用模拟数据
      setUserInfo({
        avatar: '',
        userCode: userid,
        userType: '普通用户',
        isMember: false,
        memberExpireDate: null
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  // 处理会员开通
  const handleActivateMember = () => {
    // 这里可以跳转到会员开通页面或显示开通弹窗
    alert('会员功能开发中...');
  };

  // 处理退出登录
  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      navigate('/');
    }
  };

  // 处理功能项点击
  const handleFunctionClick = (type) => {
    switch (type) {
      case 'feedback':
        alert('意见反馈功能开发中...');
        break;
      case 'customer-service':
        alert('联系客服功能开发中...');
        break;
      case 'share':
        alert('分享推荐功能开发中...');
        break;
      case 'about':
        alert('关于我们功能开发中...');
        break;
      default:
        break;
    }
  };

  // 处理订单类型切换
  const handleOrderTypeChange = (type) => {
    setOrderType(type);
  };

  // 处理订单状态点击
  const handleOrderStatusClick = (status) => {
    alert(`${status}功能开发中...`);
  };

  // 如果不是小程序环境，不显示此页面
  if (!isMiniProgram) {
    return null;
  }

  return (
    <div className="user-profile-page">
      {/* 用户信息卡片 */}
      <div className="user-info-card">
        <div className="user-avatar">
          <div className="avatar-placeholder">
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="用户头像" />
            ) : (
              <div className="avatar-icon">
                {/* <img src="/Users/mac/project/AI_memory/src/asset/tx.jpeg" alt="用户头像" /> */}
              </div>
            )}
          </div>
          <div className="chat-icon">💬</div>
        </div>
        
        <div className="user-details">
          <div className="user-id">用户{userInfo.userCode}</div>
          <div className="user-type">{userInfo.userType}</div>
        </div>
        
        <div className="logout-section" onClick={handleLogout}>
          <span className="logout-text">退出登录</span>
          <span className="logout-arrow">&gt;</span>
        </div>
      </div>

      {/* 会员卡片 */}
      <div className="membership-card">
        <div className="membership-left">
          <div className="crown-icon">👑</div>
          <div className="membership-info">
            <div className="membership-title">时与墨AI回忆录会员</div>
            <div className="membership-benefits">
              权益描述01·权益描述02·权益描述03
            </div>
          </div>
        </div>
        
        <div className="membership-action">
          <button 
            className="activate-btn"
            onClick={handleActivateMember}
          >
            立即开通
          </button>
        </div>
      </div>

      {/* 我的订单区域 */}
      <div className="orders-section">
        <div className="section-title">我的订单</div>
        

        {/* 订单状态图标网格 */}
        <div className="order-status-grid">
          <div className="order-status-item" onClick={() => handleOrderStatusClick('全部订单')}>
            <div className="status-icon">
              <SvgIcon name="document" width={24} height={24} />
            </div>
            <div className="status-text">全部订单</div>
          </div>
          
          <div className="order-status-item" onClick={() => handleOrderStatusClick('待付款')}>
            <div className="status-icon">
              <SvgIcon name="wallet" width={24} height={24} />
            </div>
            <div className="status-text">待付款</div>
          </div>
          
          <div className="order-status-item" onClick={() => handleOrderStatusClick('进行中')}>
            <div className="status-icon">
              <SvgIcon name="package" width={24} height={24} />
            </div>
            <div className="status-text">进行中</div>
          </div>
          
          <div className="order-status-item" onClick={() => handleOrderStatusClick('待收货')}>
            <div className="status-icon">
              <SvgIcon name="truck" width={24} height={24} />
            </div>
            <div className="status-text">待收货</div>
          </div>
          
          <div className="order-status-item" onClick={() => handleOrderStatusClick('待评价')}>
            <div className="status-icon">
              <SvgIcon name="comment" width={24} height={24} />
            </div>
            <div className="status-text">待评价</div>
          </div>
          
          <div className="order-status-item" onClick={() => handleOrderStatusClick('退/换货')}>
            <div className="status-icon">
              <SvgIcon name="return" width={24} height={24} />
            </div>
            <div className="status-text">退/换货</div>
          </div>
        </div>
      </div>

      {/* 功能列表 */}
      <div className="function-list">
        <div className="function-item" onClick={() => handleFunctionClick('feedback')}>
          <div className="function-icon">
            <SvgIcon name="feedback" width={24} height={24} />
          </div>
          <div className="function-text">意见反馈</div>
          <div className="function-arrow">&gt;</div>
        </div>
        
        <div className="function-item" onClick={() => handleFunctionClick('customer-service')}>
          <div className="function-icon">
            <SvgIcon name="contact" width={24} height={24} />
          </div>
          <div className="function-text">联系客服</div>
          <div className="function-arrow">&gt;</div>
        </div>
        
        <div className="function-item" onClick={() => handleFunctionClick('share')}>
          <div className="function-icon">
            <SvgIcon name="share" width={24} height={24} />
          </div>
          <div className="function-text">分享推荐</div>
          <div className="function-arrow">&gt;</div>
        </div>
        
        <div className="function-item" onClick={() => handleFunctionClick('about')}>
          <div className="function-icon">
            <SvgIcon name="about" width={24} height={24} />
          </div>
          <div className="function-text">关于我们</div>
          <div className="function-arrow">&gt;</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 