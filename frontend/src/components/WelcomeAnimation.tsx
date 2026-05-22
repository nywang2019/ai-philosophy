import { useState, useEffect } from "react";

// 经典文史哲短句，匹配系统10个模块的气质
const PHRASES = [
  "究天人之际，通古今之变",
  "道可道，非常道；名可名，非常名",
  "学而时习之，不亦说乎",
  "以史为镜，可以知兴替",
  "我思故我在",
  "认识你自己",
  "存在先于本质",
  "大音希声，大象无形",
  "知行合一",
  "凡是可说的，都可以说清楚",
  "不知周之梦为蝴蝶与",
  "兴于诗，立于礼，成于乐",
  "己所不欲，勿施于人",
  "上善若水，水善利万物而不争",
  "博学之，审问之，慎思之，明辨之，笃行之",
];

const AUTHORS = [
  "——司马迁《报任安书》",
  "——老子《道德经》",
  "——孔子《论语》",
  "——李世民",
  "——笛卡尔",
  "——德尔斐神谕",
  "——萨特",
  "——老子",
  "——王阳明",
  "——维特根斯坦",
  "——庄子《齐物论》",
  "——孔子",
  "——孔子",
  "——老子",
  "——《中庸》",
];

const WelcomeAnimation: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 600);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="welcome-animation">
      <img src="/db.png" alt="文·史·哲" className="welcome-logo" />
      <div className={`welcome-quote ${visible ? "in" : "out"}`}>
        <div className="welcome-quote-text">{PHRASES[index]}</div>
        <div className="welcome-quote-author">{AUTHORS[index]}</div>
      </div>
      <div className="welcome-dots">
        {PHRASES.map((_, i) => (
          <span
            key={i}
            className={`welcome-dot ${i === index ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
};

export default WelcomeAnimation;
