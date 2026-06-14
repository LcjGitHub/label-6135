import pytest

from models import Episode, ListenStatus, Podcast


class TestCreatePodcast:
    def test_create_podcast_success(self, client, db_session):
        payload = {
            "name": "测试播客",
            "platform": "小宇宙",
            "theme": "技术",
            "rating": 8.0,
            "notes": "测试用的播客",
            "subscribe_url": "https://example.com/podcast",
            "is_favorited": False,
        }
        response = client.post("/api/podcasts", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["platform"] == payload["platform"]
        assert data["theme"] == payload["theme"]
        assert data["rating"] == payload["rating"]
        assert data["notes"] == payload["notes"]
        assert data["subscribe_url"] == payload["subscribe_url"]
        assert data["is_favorited"] is False
        assert "id" in data
        assert data["id"] > 0

        db_podcast = db_session.query(Podcast).filter(Podcast.id == data["id"]).first()
        assert db_podcast is not None
        assert db_podcast.name == payload["name"]

    def test_create_podcast_favorited_true(self, client, db_session):
        payload = {
            "name": "收藏的播客",
            "platform": "Apple Podcasts",
            "theme": "设计",
            "rating": 9.0,
            "is_favorited": True,
        }
        response = client.post("/api/podcasts", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["is_favorited"] is True

    def test_create_podcast_validation_error(self, client):
        payload = {
            "name": "",
            "platform": "小宇宙",
            "theme": "技术",
            "rating": 8.0,
        }
        response = client.post("/api/podcasts", json=payload)
        assert response.status_code == 422

    def test_create_podcast_rating_out_of_range(self, client):
        payload = {
            "name": "测试播客",
            "platform": "小宇宙",
            "theme": "技术",
            "rating": 11.0,
        }
        response = client.post("/api/podcasts", json=payload)
        assert response.status_code == 422

    def test_create_podcast_rating_negative(self, client):
        payload = {
            "name": "测试播客",
            "platform": "小宇宙",
            "theme": "技术",
            "rating": -1.0,
        }
        response = client.post("/api/podcasts", json=payload)
        assert response.status_code == 422

    def test_create_podcast_optional_fields_default(self, client, db_session):
        payload = {
            "name": "最小字段播客",
            "platform": "小宇宙",
            "theme": "技术",
            "rating": 7.0,
        }
        response = client.post("/api/podcasts", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["notes"] is None
        assert data["subscribe_url"] is None
        assert data["is_favorited"] is False


class TestListPodcasts:
    def test_list_podcasts_empty(self, client):
        response = client.get("/api/podcasts")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_podcasts_multiple(self, client, make_podcast):
        p1 = make_podcast(name="播客A")
        p2 = make_podcast(name="播客B", platform="Apple Podcasts", theme="后端", rating=9.0)

        response = client.get("/api/podcasts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "播客A"
        assert data[1]["name"] == "播客B"

    def test_list_podcasts_filter_by_favorited(self, client, make_podcast):
        make_podcast(name="收藏播客", is_favorited=True)
        make_podcast(name="未收藏播客", is_favorited=False)

        response = client.get("/api/podcasts", params={"favorited_only": "true"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "收藏播客"

    def test_list_podcasts_filter_by_platform(self, client, make_podcast):
        make_podcast(name="小宇宙播客", platform="小宇宙")
        make_podcast(name="苹果播客", platform="Apple Podcasts")

        response = client.get("/api/podcasts", params={"platform": "小宇宙"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["platform"] == "小宇宙"

    def test_list_podcasts_filter_by_keyword(self, client, make_podcast):
        make_podcast(name="前端早咖啡", theme="前端")
        make_podcast(name="后端夜话", theme="后端")

        response = client.get("/api/podcasts", params={"keyword": "前端"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "前端早咖啡"

    def test_list_podcasts_sort_by_rating_desc(self, client, make_podcast):
        make_podcast(name="低分播客", rating=6.0)
        make_podcast(name="高分播客", rating=9.0)

        response = client.get("/api/podcasts", params={"sort_by_rating": "desc"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["rating"] == 9.0
        assert data[1]["rating"] == 6.0

    def test_list_podcasts_sort_by_rating_asc(self, client, make_podcast):
        make_podcast(name="低分播客", rating=6.0)
        make_podcast(name="高分播客", rating=9.0)

        response = client.get("/api/podcasts", params={"sort_by_rating": "asc"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["rating"] == 6.0
        assert data[1]["rating"] == 9.0

    def test_list_podcasts_combined_filters(self, client, make_podcast):
        make_podcast(name="小宇宙技术A", platform="小宇宙", theme="技术", rating=8.0, is_favorited=True)
        make_podcast(name="小宇宙技术B", platform="小宇宙", theme="技术", rating=7.0, is_favorited=False)
        make_podcast(name="苹果设计A", platform="Apple Podcasts", theme="设计", rating=9.0, is_favorited=True)

        response = client.get(
            "/api/podcasts",
            params={"favorited_only": "true", "platform": "小宇宙", "sort_by_rating": "desc"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "小宇宙技术A"


class TestGetPodcastDetail:
    def test_get_podcast_detail_with_episodes(self, client, make_podcast, make_episode):
        podcast = make_podcast(name="测试播客")
        e1 = make_episode(podcast_id=podcast.id, title="第一集", recommendation="推荐听")
        e2 = make_episode(podcast_id=podcast.id, title="第二集", listen_status=ListenStatus.LISTENED)

        response = client.get(f"/api/podcasts/{podcast.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "测试播客"
        assert data["id"] == podcast.id
        assert len(data["episodes"]) == 2
        assert data["episodes"][0]["title"] == "第一集"
        assert data["episodes"][0]["recommendation"] == "推荐听"
        assert data["episodes"][1]["title"] == "第二集"
        assert data["episodes"][1]["listen_status"] == "已收听"

    def test_get_podcast_detail_no_episodes(self, client, make_podcast):
        podcast = make_podcast(name="空播客")

        response = client.get(f"/api/podcasts/{podcast.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "空播客"
        assert data["episodes"] == []

    def test_get_podcast_not_found(self, client):
        response = client.get("/api/podcasts/9999")
        assert response.status_code == 404
        assert response.json()["detail"] == "播客不存在"


class TestUpdatePodcast:
    def test_update_podcast_name(self, client, db_session, make_podcast):
        podcast = make_podcast(name="旧名字")

        response = client.put(
            f"/api/podcasts/{podcast.id}",
            json={"name": "新名字"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "新名字"
        assert data["platform"] == "小宇宙"

        db_session.refresh(podcast)
        assert podcast.name == "新名字"

    def test_update_podcast_partial_fields(self, client, db_session, make_podcast):
        podcast = make_podcast(rating=7.0, is_favorited=False)

        response = client.put(
            f"/api/podcasts/{podcast.id}",
            json={"rating": 9.5, "theme": "产品设计"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 9.5
        assert data["theme"] == "产品设计"
        assert data["name"] == "测试播客"

        db_session.refresh(podcast)
        assert podcast.rating == 9.5
        assert podcast.theme == "产品设计"

    def test_update_podcast_all_fields(self, client, db_session, make_podcast):
        podcast = make_podcast()

        payload = {
            "name": "完全更新",
            "platform": "网易云音乐",
            "theme": "商业",
            "rating": 10.0,
            "notes": "新笔记",
            "subscribe_url": "https://new.example.com",
        }
        response = client.put(f"/api/podcasts/{podcast.id}", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "完全更新"
        assert data["platform"] == "网易云音乐"
        assert data["rating"] == 10.0

    def test_update_podcast_invalid_rating(self, client, make_podcast):
        podcast = make_podcast()
        response = client.put(
            f"/api/podcasts/{podcast.id}",
            json={"rating": 15.0},
        )
        assert response.status_code == 422

    def test_update_podcast_invalid_name(self, client, make_podcast):
        podcast = make_podcast()
        response = client.put(
            f"/api/podcasts/{podcast.id}",
            json={"name": ""},
        )
        assert response.status_code == 422

    def test_update_podcast_not_found(self, client):
        response = client.put(
            "/api/podcasts/9999",
            json={"name": "不存在的播客"},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "播客不存在"


class TestDeletePodcast:
    def test_delete_podcast_success(self, client, db_session, make_podcast):
        podcast = make_podcast(name="待删除播客")
        podcast_id = podcast.id

        response = client.delete(f"/api/podcasts/{podcast_id}")
        assert response.status_code == 204
        assert response.text == ""

        db_podcast = db_session.query(Podcast).filter(Podcast.id == podcast_id).first()
        assert db_podcast is None

    def test_delete_podcast_cascades_episodes(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast(name="级联删除播客")
        e1 = make_episode(podcast_id=podcast.id, title="单集A")
        e2 = make_episode(podcast_id=podcast.id, title="单集B")
        episode_ids = [e1.id, e2.id]

        response = client.delete(f"/api/podcasts/{podcast.id}")
        assert response.status_code == 204

        remaining = db_session.query(Episode).filter(Episode.id.in_(episode_ids)).all()
        assert len(remaining) == 0

    def test_delete_podcast_not_found(self, client):
        response = client.delete("/api/podcasts/9999")
        assert response.status_code == 404
        assert response.json()["detail"] == "播客不存在"


class TestToggleFavorite:
    def test_toggle_favorite_to_true(self, client, db_session, make_podcast):
        podcast = make_podcast(name="切换收藏", is_favorited=False)

        response = client.patch(f"/api/podcasts/{podcast.id}/favorite")
        assert response.status_code == 200
        data = response.json()
        assert data["is_favorited"] is True

        db_session.refresh(podcast)
        assert podcast.is_favorited is True

    def test_toggle_favorite_to_false(self, client, db_session, make_podcast):
        podcast = make_podcast(name="取消收藏", is_favorited=True)

        response = client.patch(f"/api/podcasts/{podcast.id}/favorite")
        assert response.status_code == 200
        data = response.json()
        assert data["is_favorited"] is False

        db_session.refresh(podcast)
        assert podcast.is_favorited is False

    def test_toggle_favorite_twice(self, client, make_podcast):
        podcast = make_podcast(name="两次切换", is_favorited=False)

        client.patch(f"/api/podcasts/{podcast.id}/favorite")
        response = client.patch(f"/api/podcasts/{podcast.id}/favorite")
        assert response.status_code == 200
        assert response.json()["is_favorited"] is False

    def test_toggle_favorite_not_found(self, client):
        response = client.patch("/api/podcasts/9999/favorite")
        assert response.status_code == 404
        assert response.json()["detail"] == "播客不存在"
