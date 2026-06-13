"""初始化种子数据：3 个播客，各 2 单集。"""

from sqlalchemy.orm import Session

from models import Episode, Podcast

SEED_PODCASTS: list[dict] = [
    {
        "name": "前端早咖啡",
        "platform": "小宇宙",
        "theme": "前端工程与 Web 技术",
        "rating": 8.5,
        "notes": "适合通勤听，更新稳定，嘉宾质量高。",
        "is_favorited": True,
        "episodes": [
            {
                "title": "React 19 新特性速览",
                "recommendation": "想跟上 React 生态变化时必听的一期。",
            },
            {
                "title": "CSS 容器查询实战",
                "recommendation": "用真实项目案例讲清楚 container query 的用法。",
            },
        ],
    },
    {
        "name": "独立开发者电台",
        "platform": "Apple Podcasts",
        "theme": "独立开发 / 产品 / 副业",
        "rating": 9.0,
        "notes": "访谈型节目，很多一线 indie hacker 的真实经历。",
        "is_favorited": False,
        "episodes": [
            {
                "title": "从 0 到 1 做 SaaS 的 12 个月",
                "recommendation": "收入、获客、定价都讲得很具体，少空话。",
            },
            {
                "title": "一人公司如何管理时间与精力",
                "recommendation": "不是鸡汤，有可执行的日程与边界设置方法。",
            },
        ],
    },
    {
        "name": "设计杂谈",
        "platform": "网易云音乐",
        "theme": "UI/UX 与设计系统",
        "rating": 7.8,
        "notes": "偏设计视角，对前端同学理解产品很有帮助。",
        "is_favorited": False,
        "episodes": [
            {
                "title": "MUI v6 设计 token 迁移笔记",
                "recommendation": "设计和开发如何对齐 token，减少返工。",
            },
            {
                "title": "信息架构入门：从导航到内容层级",
                "recommendation": "做后台/内容型产品时特别实用的一期。",
            },
        ],
    },
]


def seed_database(db: Session) -> None:
    """
    若数据库为空则写入种子数据。

    @param {Session} db - SQLAlchemy 会话
    """
    if db.query(Podcast).count() > 0:
        return

    for item in SEED_PODCASTS:
        episodes_data = item["episodes"]
        podcast = Podcast(
            name=item["name"],
            platform=item["platform"],
            theme=item["theme"],
            rating=item["rating"],
            notes=item["notes"],
            is_favorited=item.get("is_favorited", False),
        )
        db.add(podcast)
        db.flush()
        for ep in episodes_data:
            db.add(Episode(podcast_id=podcast.id, **ep))

    db.commit()
