from gen import mock_synth, parse, split_lines


def test_plain_text_is_one_narrator_segment():
    clean, cues, segs = parse("你好，世界。")
    assert clean == "你好，世界。"
    assert cues == {}
    assert segs == [{"s": 0, "v": None, "pause": 0.0, "e": 6}]


def test_cues_are_stripped_and_record_char_offsets():
    clean, cues, segs = parse("[[a]]第一句。[[b]]第二句。[[tail]]")
    assert clean == "第一句。第二句。"
    assert cues == {"a": 0, "b": 4, "tail": 8}
    assert len(segs) == 1


def test_pause_splits_segments_and_carries_length():
    clean, _, segs = parse("前半句。||后半句。", pause=0.5)
    assert clean == "前半句。后半句。"
    assert [(clean[s["s"]:s["e"]], s["v"], s["pause"]) for s in segs] == [("前半句。", None, 0.5), ("后半句。", None, 0.0)]


def test_double_pause_accumulates_on_previous_segment():
    _, _, segs = parse("一。||||二。", pause=0.75)
    assert [s["pause"] for s in segs] == [1.5, 0.0]


def test_alternate_voice_quote():
    clean, cues, segs = parse("他说：<<q|别对齐画面。>>||[[after]]然后。", pause=0.7)
    assert clean == "他说：别对齐画面。然后。"
    assert [(clean[s["s"]:s["e"]], s["v"], s["pause"]) for s in segs] == [
        ("他说：", None, 0.0),
        ("别对齐画面。", "q", 0.7),
        ("然后。", None, 0.0),
    ]
    assert cues == {"after": clean.index("然后")}


def test_cue_inside_quote_keeps_offset():
    clean, cues, segs = parse("<<zc|[[q]]全球化几乎已死。>>")
    assert clean == "全球化几乎已死。"
    assert cues == {"q": 0}
    assert [s["v"] for s in segs] == ["zc"]


def test_split_lines_merges_short_clauses_until_sentence_end():
    text = "旁白改一句，后面全部重来。下一句。"
    lines = [text[s:e] for s, e in split_lines(text, max_line=20)]
    assert lines == ["旁白改一句，后面全部重来。", "下一句。"]


def test_split_lines_respects_max_line():
    text = "一二三四五，六七八九十，甲乙丙丁戊。"
    lines = [text[s:e] for s, e in split_lines(text, max_line=8)]
    assert lines == ["一二三四五，", "六七八九十，", "甲乙丙丁戊。"]
    assert all(len(x) <= 8 for x in lines)


def test_split_lines_keeps_unpunctuated_tail_and_covers_all_text():
    text = "第一句，没有句号的结尾"
    spans = split_lines(text, max_line=6)
    assert [text[s:e] for s, e in spans] == ["第一句，", "没有句号的结尾"]
    assert "".join(text[s:e] for s, e in spans) == text


def test_mock_synth_timing():
    pcm, words = mock_synth("你好，ab。", cps=4.0)
    # 你 好 ， ab(2 chars) 。 = 6 chars at 0.25 s each
    assert [w["w"] for w in words] == ["你", "好", "ab"]
    assert [w["t"] for w in words] == [0.0, 0.25, 0.75]
    assert len(pcm) == int(1.5 * 24000) * 2
