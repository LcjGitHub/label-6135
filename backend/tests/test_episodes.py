import pytest

from models import Episode, ListenStatus, Podcast


class TestListAllEpisodes:
    def test_list_all_episodes_empty(self, client):
        response = client.get("/api/episodes")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_all_episodes_across_podcasts(self, client, make_podcast, make_episode):
        p1 = make_podcast(name="播客一", platform="小宇宙")
        p2 = make_podcast(name="播客二", platform="Apple Podcasts")
        e1 = make_episode(podcast_id=p1.id, title="第一集A")
        e2 = make_episode(podcast_id=p2.id, title="第二集B")
        e3 = make_episode(podcast_id=p1.id, title="第三集C", listen_status=ListenStatus.LISTENED)

        response = client.get("/api/episodes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        assert data[0]["id"] == e1.id
        assert data[0]["podcast_id"] == p1.id
        assert data[0]["podcast_name"] == "播客一"
        assert data[0]["title"] == "第一集A"

        assert data[1]["id"] == e2.id
        assert data[1]["podcast_id"] == p2.id
        assert data[1]["podcast_name"] == "播客二"

        assert data[2]["id"] == e3.id
        assert data[2]["listen_status"] == "已收听"

    def test_list_all_episodes_contains_all_fields(self, client, make_podcast, make_episode):
        p = make_podcast(name="完整字段播客")
        e = make_episode(
            podcast_id=p.id,
            title="完整字段单集",
            recommendation="非常推荐",
            listen_status=ListenStatus.LISTENED,
        )

        response = client.get("/api/episodes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert item["id"] == e.id
        assert item["podcast_id"] == p.id
        assert item["title"] == "完整字段单集"
        assert item["recommendation"] == "非常推荐"
        assert item["listen_status"] == "已收听"
        assert item["podcast_name"] == "完整字段播客"

    def test_list_all_episodes_filter_unlistened(self, client, make_podcast, make_episode):
        p1 = make_podcast(name="播客一")
        make_episode(podcast_id=p1.id, title="未收听单集A", listen_status=ListenStatus.UNLISTENED)
        make_episode(podcast_id=p1.id, title="已收听单集B", listen_status=ListenStatus.LISTENED)
        make_episode(podcast_id=p1.id, title="未收听单集C", listen_status=ListenStatus.UNLISTENED)

        response = client.get("/api/episodes", params={"listen_status": "未收听"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] == "未收听单集A"
        assert data[0]["listen_status"] == "未收听"
        assert data[1]["title"] == "未收听单集C"
        assert data[1]["listen_status"] == "未收听"

    def test_list_all_episodes_filter_listened(self, client, make_podcast, make_episode):
        p1 = make_podcast(name="播客一")
        make_episode(podcast_id=p1.id, title="未收听单集A", listen_status=ListenStatus.UNLISTENED)
        make_episode(podcast_id=p1.id, title="已收听单集B", listen_status=ListenStatus.LISTENED)
        make_episode(podcast_id=p1.id, title="已收听单集C", listen_status=ListenStatus.LISTENED)

        response = client.get("/api/episodes", params={"listen_status": "已收听"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] == "已收听单集B"
        assert data[0]["listen_status"] == "已收听"
        assert data[1]["title"] == "已收听单集C"
        assert data[1]["listen_status"] == "已收听"

    def test_list_all_episodes_filter_invalid_status(self, client, make_podcast, make_episode):
        p1 = make_podcast(name="播客一")
        make_episode(podcast_id=p1.id, title="测试单集")

        response = client.get("/api/episodes", params={"listen_status": "无效状态"})
        assert response.status_code == 422


class TestCreateEpisode:
    def test_create_episode_success(self, client, db_session, make_podcast):
        podcast = make_podcast()
        payload = {
            "title": "第一集：开场",
            "recommendation": "非常值得一听",
            "listen_status": "未收听",
        }
        response = client.post(f"/api/podcasts/{podcast.id}/episodes", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["recommendation"] == payload["recommendation"]
        assert data["listen_status"] == "未收听"
        assert data["podcast_id"] == podcast.id
        assert "id" in data
        assert data["id"] > 0

        db_episode = db_session.query(Episode).filter(Episode.id == data["id"]).first()
        assert db_episode is not None
        assert db_episode.title == payload["title"]
        assert db_episode.listen_status == ListenStatus.UNLISTENED

    def test_create_episode_default_listen_status(self, client, make_podcast):
        podcast = make_podcast()
        payload = {"title": "新单集"}
        response = client.post(f"/api/podcasts/{podcast.id}/episodes", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["listen_status"] == "未收听"
        assert data["recommendation"] is None

    def test_create_episode_with_listened_status(self, client, db_session, make_podcast):
        podcast = make_podcast()
        payload = {
            "title": "已收听的单集",
            "listen_status": "已收听",
        }
        response = client.post(f"/api/podcasts/{podcast.id}/episodes", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["listen_status"] == "已收听"

    def test_create_episode_podcast_not_found(self, client):
        payload = {"title": "不存在的播客下单集"}
        response = client.post("/api/podcasts/9999/episodes", json=payload)
        assert response.status_code == 404
        assert response.json()["detail"] == "播客不存在"

    def test_create_episode_validation_error(self, client, make_podcast):
        podcast = make_podcast()
        payload = {"title": ""}
        response = client.post(f"/api/podcasts/{podcast.id}/episodes", json=payload)
        assert response.status_code == 422

    def test_create_episode_title_too_long(self, client, make_podcast):
        podcast = make_podcast()
        long_title = "a" * 301
        payload = {"title": long_title}
        response = client.post(f"/api/podcasts/{podcast.id}/episodes", json=payload)
        assert response.status_code == 422


class TestListEpisodesByPodcast:
    def test_list_episodes_for_podcast(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        e1 = make_episode(podcast_id=podcast.id, title="第一集", recommendation="推荐A")
        e2 = make_episode(podcast_id=podcast.id, title="第二集", recommendation="推荐B")

        response = client.get(f"/api/podcasts/{podcast.id}/episodes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] == "第一集"
        assert data[1]["title"] == "第二集"

    def test_list_episodes_empty_for_podcast(self, client, make_podcast):
        podcast = make_podcast(name="空播客")

        response = client.get(f"/api/podcasts/{podcast.id}/episodes")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_episodes_isolated_by_podcast(self, client, make_podcast, make_episode):
        p1 = make_podcast(name="播客1")
        p2 = make_podcast(name="播客2")
        make_episode(podcast_id=p1.id, title="只属于播客1")
        make_episode(podcast_id=p2.id, title="只属于播客2")

        response = client.get(f"/api/podcasts/{p1.id}/episodes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "只属于播客1"

    def test_list_episodes_filter_by_keyword(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        make_episode(podcast_id=podcast.id, title="React 入门")
        make_episode(podcast_id=podcast.id, title="Vue 进阶")

        response = client.get(
            f"/api/podcasts/{podcast.id}/episodes", params={"keyword": "React"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "React 入门"

    def test_list_episodes_keyword_no_match(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        make_episode(podcast_id=podcast.id, title="React 入门")

        response = client.get(
            f"/api/podcasts/{podcast.id}/episodes", params={"keyword": "不存在的关键词"}
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_list_episodes_podcast_not_found(self, client):
        response = client.get("/api/podcasts/9999/episodes")
        assert response.status_code == 404
        assert response.json()["detail"] == "播客不存在"

    def test_list_episodes_sort_by_duration_asc(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        make_episode(podcast_id=podcast.id, title="长单集", duration=60)
        make_episode(podcast_id=podcast.id, title="短单集", duration=10)
        make_episode(podcast_id=podcast.id, title="中等单集", duration=30)

        response = client.get(
            f"/api/podcasts/{podcast.id}/episodes",
            params={"sort_by_duration": "asc"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["title"] == "短单集"
        assert data[1]["title"] == "中等单集"
        assert data[2]["title"] == "长单集"

    def test_list_episodes_sort_by_duration_desc(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        make_episode(podcast_id=podcast.id, title="长单集", duration=60)
        make_episode(podcast_id=podcast.id, title="短单集", duration=10)
        make_episode(podcast_id=podcast.id, title="中等单集", duration=30)

        response = client.get(
            f"/api/podcasts/{podcast.id}/episodes",
            params={"sort_by_duration": "desc"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["title"] == "长单集"
        assert data[1]["title"] == "中等单集"
        assert data[2]["title"] == "短单集"

    def test_list_episodes_sort_by_duration_with_null(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        make_episode(podcast_id=podcast.id, title="无时长", duration=None)
        make_episode(podcast_id=podcast.id, title="有时长", duration=30)

        response = client.get(
            f"/api/podcasts/{podcast.id}/episodes",
            params={"sort_by_duration": "asc"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_list_episodes_sort_by_duration_and_title_combined(
        self, client, make_podcast, make_episode
    ):
        podcast = make_podcast()
        make_episode(podcast_id=podcast.id, title="B集", duration=30)
        make_episode(podcast_id=podcast.id, title="A集", duration=30)
        make_episode(podcast_id=podcast.id, title="C集", duration=10)

        response = client.get(
            f"/api/podcasts/{podcast.id}/episodes",
            params={"sort_by_duration": "asc", "sort_by_title": "asc"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["title"] == "C集"
        assert data[1]["title"] == "A集"
        assert data[2]["title"] == "B集"

    def test_list_episodes_sort_by_duration_invalid(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        make_episode(podcast_id=podcast.id, title="测试")

        response = client.get(
            f"/api/podcasts/{podcast.id}/episodes",
            params={"sort_by_duration": "invalid"},
        )
        assert response.status_code == 422


class TestUpdateEpisode:
    def test_update_episode_title(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(podcast_id=podcast.id, title="旧标题")

        response = client.put(
            f"/api/episodes/{episode.id}",
            json={"title": "新标题"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "新标题"

        db_session.refresh(episode)
        assert episode.title == "新标题"

    def test_update_episode_recommendation(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(podcast_id=podcast.id, recommendation="旧推荐")

        response = client.put(
            f"/api/episodes/{episode.id}",
            json={"recommendation": "新推荐"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["recommendation"] == "新推荐"

    def test_update_episode_listen_status(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(
            podcast_id=podcast.id, listen_status=ListenStatus.UNLISTENED
        )

        response = client.put(
            f"/api/episodes/{episode.id}",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["listen_status"] == "已收听"

    def test_update_episode_all_fields(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(podcast_id=podcast.id, title="原标题")

        response = client.put(
            f"/api/episodes/{episode.id}",
            json={
                "title": "全新标题",
                "recommendation": "全新推荐",
                "listen_status": "已收听",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "全新标题"
        assert data["recommendation"] == "全新推荐"
        assert data["listen_status"] == "已收听"

    def test_update_episode_other_podcast_episode(self, client, make_podcast, make_episode):
        p1 = make_podcast(name="播客1")
        p2 = make_podcast(name="播客2")
        e = make_episode(podcast_id=p1.id, title="播客1的单集")

        response = client.put(
            f"/api/episodes/{e.id}",
            json={"title": "更新标题"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["podcast_id"] == p1.id

    def test_update_episode_invalid_title(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(podcast_id=podcast.id)

        response = client.put(
            f"/api/episodes/{episode.id}",
            json={"title": ""},
        )
        assert response.status_code == 422

    def test_update_episode_not_found(self, client):
        response = client.put(
            "/api/episodes/9999",
            json={"title": "不存在的单集"},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "单集不存在"


class TestDeleteEpisode:
    def test_delete_episode_success(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(podcast_id=podcast.id, title="待删除单集")
        episode_id = episode.id

        response = client.delete(f"/api/episodes/{episode_id}")
        assert response.status_code == 204
        assert response.text == ""

        db_episode = db_session.query(Episode).filter(Episode.id == episode_id).first()
        assert db_episode is None

    def test_delete_episode_preserves_other_episodes(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        e1 = make_episode(podcast_id=podcast.id, title="保留单集")
        e2 = make_episode(podcast_id=podcast.id, title="删除单集")

        client.delete(f"/api/episodes/{e2.id}")

        remaining = db_session.query(Episode).filter(Episode.podcast_id == podcast.id).all()
        assert len(remaining) == 1
        assert remaining[0].id == e1.id

    def test_delete_episode_preserves_podcast(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast(name="保留播客")
        episode = make_episode(podcast_id=podcast.id, title="待删单集")

        client.delete(f"/api/episodes/{episode.id}")

        db_podcast = db_session.query(Podcast).filter(Podcast.id == podcast.id).first()
        assert db_podcast is not None
        assert db_podcast.name == "保留播客"

    def test_delete_episode_not_found(self, client):
        response = client.delete("/api/episodes/9999")
        assert response.status_code == 404
        assert response.json()["detail"] == "单集不存在"


class TestUpdateSingleListenStatus:
    def test_update_single_listen_status_to_listened(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(
            podcast_id=podcast.id, title="测试单集", listen_status=ListenStatus.UNLISTENED
        )

        response = client.put(
            f"/api/episodes/{episode.id}/listen-status",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["listen_status"] == "已收听"

        db_session.refresh(episode)
        assert episode.listen_status == ListenStatus.LISTENED

    def test_update_single_listen_status_to_unlistened(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(
            podcast_id=podcast.id, title="测试单集", listen_status=ListenStatus.LISTENED
        )

        response = client.put(
            f"/api/episodes/{episode.id}/listen-status",
            json={"listen_status": "未收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["listen_status"] == "未收听"

        db_session.refresh(episode)
        assert episode.listen_status == ListenStatus.UNLISTENED

    def test_update_single_listen_status_idempotent(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(
            podcast_id=podcast.id, title="幂等单集", listen_status=ListenStatus.LISTENED
        )

        response = client.put(
            f"/api/episodes/{episode.id}/listen-status",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["listen_status"] == "已收听"

    def test_update_single_listen_status_not_found(self, client):
        response = client.put(
            "/api/episodes/9999/listen-status",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "单集不存在"

    def test_update_single_listen_status_invalid(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(podcast_id=podcast.id, title="测试单集")

        response = client.put(
            f"/api/episodes/{episode.id}/listen-status",
            json={"listen_status": "无效状态"},
        )
        assert response.status_code == 422

    def test_update_single_listen_status_missing_field(self, client, make_podcast, make_episode):
        podcast = make_podcast()
        episode = make_episode(podcast_id=podcast.id, title="测试单集")

        response = client.put(
            f"/api/episodes/{episode.id}/listen-status",
            json={},
        )
        assert response.status_code == 422


class TestBatchUpdateListenStatus:
    def test_batch_update_listen_status_all_to_listened(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        e1 = make_episode(podcast_id=podcast.id, title="第一集", listen_status=ListenStatus.UNLISTENED)
        e2 = make_episode(podcast_id=podcast.id, title="第二集", listen_status=ListenStatus.UNLISTENED)

        response = client.put(
            f"/api/podcasts/{podcast.id}/episodes/listen-status",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 2
        assert data["podcast_id"] == podcast.id

        db_session.refresh(e1)
        db_session.refresh(e2)
        assert e1.listen_status == ListenStatus.LISTENED
        assert e2.listen_status == ListenStatus.LISTENED

    def test_batch_update_listen_status_all_to_unlistened(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        e1 = make_episode(podcast_id=podcast.id, title="第一集", listen_status=ListenStatus.LISTENED)
        e2 = make_episode(podcast_id=podcast.id, title="第二集", listen_status=ListenStatus.LISTENED)

        response = client.put(
            f"/api/podcasts/{podcast.id}/episodes/listen-status",
            json={"listen_status": "未收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 2

    def test_batch_update_listen_status_skip_already_listened(self, client, db_session, make_podcast, make_episode):
        podcast = make_podcast()
        e1 = make_episode(podcast_id=podcast.id, title="第一集", listen_status=ListenStatus.LISTENED)
        e2 = make_episode(podcast_id=podcast.id, title="第二集", listen_status=ListenStatus.UNLISTENED)

        response = client.put(
            f"/api/podcasts/{podcast.id}/episodes/listen-status",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 1

    def test_batch_update_listen_status_does_not_affect_other_podcast(
        self, client, db_session, make_podcast, make_episode
    ):
        p1 = make_podcast(name="播客1")
        p2 = make_podcast(name="播客2")
        e1 = make_episode(podcast_id=p1.id, title="播客1单集", listen_status=ListenStatus.UNLISTENED)
        e2 = make_episode(podcast_id=p2.id, title="播客2单集", listen_status=ListenStatus.UNLISTENED)

        client.put(
            f"/api/podcasts/{p1.id}/episodes/listen-status",
            json={"listen_status": "已收听"},
        )

        db_session.refresh(e1)
        db_session.refresh(e2)
        assert e1.listen_status == ListenStatus.LISTENED
        assert e2.listen_status == ListenStatus.UNLISTENED

    def test_batch_update_listen_status_podcast_not_found(self, client):
        response = client.put(
            "/api/podcasts/9999/episodes/listen-status",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "播客不存在"

    def test_batch_update_listen_status_empty_podcast(self, client, make_podcast):
        podcast = make_podcast(name="空播客")

        response = client.put(
            f"/api/podcasts/{podcast.id}/episodes/listen-status",
            json={"listen_status": "已收听"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 0
        assert data["podcast_id"] == podcast.id

    def test_batch_update_listen_status_invalid_status(self, client, make_podcast):
        podcast = make_podcast()

        response = client.put(
            f"/api/podcasts/{podcast.id}/episodes/listen-status",
            json={"listen_status": "无效状态"},
        )
        assert response.status_code == 422
