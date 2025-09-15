"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversationStore } from "./use-conversation-store";
import { Bubble } from "./bubble";
import { BubbleEmpty } from "./bubble-empty";

function BubbleList() {
  const { currentSessionId, sessionList } = useConversationStore();

  const scrollContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 检测是否滚动到底部
  const checkIfAtBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      const threshold = 50; // 允许50px的误差
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(atBottom);
    }
  }, []);

  // 滚动事件处理
  const handleScroll = useCallback(() => {
    setIsUserScrolling(true);
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  // 滚动停止检测
  useEffect(() => {
    let scrollTimer;

    const handleScrollEnd = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setIsUserScrolling(false);
      }, 150); // 150ms后认为用户停止滚动
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScrollEnd);
      return () => {
        scrollContainer.removeEventListener("scroll", handleScrollEnd);
        clearTimeout(scrollTimer);
      };
    }
  }, []);

  // 添加滚动事件监听器
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // 初始化时检测是否在底部
  useEffect(() => {
    if (scrollContainerRef.current) {
      checkIfAtBottom();
    }
  }, [currentSessionId, checkIfAtBottom]);

  // 自动滚动到底部（只在用户未手动滚动且不在底部时执行）
  useEffect(() => {
    const currentSession = sessionList
      .filter((session) => session.id === currentSessionId)
      .at(0);

    if (
      currentSession &&
      scrollContainerRef.current &&
      !isUserScrolling &&
      isAtBottom
    ) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [sessionList, currentSessionId, isUserScrolling, isAtBottom]);

  return (
    <div className="conversation-messages" ref={scrollContainerRef}>
      {sessionList
        .filter((session) => session.id === currentSessionId)
        .at(0)
        ?.message.map((item) => {
          if (item.msgType === "realtime") {
            return <Bubble key={item.itemId} msg={item} />;
          }
        })}
      <BubbleEmpty />
    </div>
  );
}

export default BubbleList;
export { BubbleList };
