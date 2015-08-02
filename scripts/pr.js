'use strict';



var Diff = class {
	constructor(id) {
		this.id = id;
		this.hash = this.quickHash(this.changesContents());
		this.isReviewed = (localStorage[id] === this.hash);
	}

	set isReviewed(bool) {
		this._isReviewed = bool;
		console.log(this.id + " set isReviewed to " + bool);
		if (bool) {
			localStorage[this.id] = this.hash;
		} else {
			localStorage.removeItem(this.id);
		}
		this.updateUI()
	}

	get isReviewed() {
		return this._isReviewed;
	}

	updateLink(link) {
		console.log(link)
		if (this.isReviewed) {
			link.addClass("github-pr-link-reviewed");
		} else {
			link.removeClass("github-pr-link-reviewed");
		}
	}

	updateUI() {
		this.updateCodeBlock(this.diffContents());
		this.updateTOCLink();
		this.updateMarkAsReviewedLink();
	}

	markAsReviewedLink() {
		return $("a#mark-as-reviewed-" + this.id)
	}

	updateMarkAsReviewedLink() {
		var link = this.markAsReviewedLink();
		if (this.isReviewed) {
			$(link).addClass("github-pr-link-mark-as-reviewed");
		} else {
			$(link).removeClass("github-pr-link-mark-as-reviewed");
		}
	}

	updateTOCLink() {
		var link = this.TOCLink();
		if (this.isReviewed) {
			$(link).addClass("github-pr-toc-reviewed");
		} else {
			$(link).removeClass("github-pr-toc-reviewed");
		}
	}

	updateCodeBlock(codeBlock) {
		if (this.isReviewed) {
			$(codeBlock).addClass("github-pr-code-reviewed");
		} else {
			$(codeBlock).removeClass("github-pr-code-reviewed");
		}
	}

	contents() {
		return $("a[name='diff-" + this.id + "']").next();
	}

	TOCLink() {
		return $("div#toc").find("a[href='#diff-" + this.id + "']");
	}

	diffContents() {
		return this.contents().find(".blob-wrapper");
	}

	changesContents() {
		var contents = this.diffContents();
		var result = ""
		$(contents).find(".blob-code-addition,.blob-code-deletion").each(function(i, td){
			result += $(td).text();
		});
		return result;
	}

	quickHash(string) {
		return window.btoa(encodeURIComponent(escape(string)));
	}
}

class GitHubPR {
	
	constructor() {
		this.diffList = this.buildDiffList();
		this.addMarkAsReviewedButton(this.diffList);
		this.addCustomDiffStatistics();
		this.originalTitle = document.title;
		this.updateGlobalCounter();
	}
	
	buildDiffList() {
		return $("div[class^='file'][id^='diff']").map(function(x, y){
			var diffId = $(y).prev().attr('name').replace(/diff\-([a-f0-9]+)/, '$1'); 
			return new Diff(diffId);
		});
	}

	addMarkAsReviewedButton(diffList) {
		var self = this
		$(diffList).each(function(i, diff){
			var fileActions = diff.contents().find(".file-actions");
			var link = $('<a class="octicon-btn tooltipped tooltipped-nw" id="mark-as-reviewed-' + diff.id + '" href="#' + diff.id + '" aria-label="Mark file as reviewed"><span class="octicon octicon-check"></span></a>');
			link.click(function(){
				diff.isReviewed = !diff.isReviewed;
				diff.updateLink(link);
				self.updateGlobalCounter();
				return false
			});
			fileActions.append(link);
			diff.updateUI();
		});
	}

	updateGlobalCounter() {
		var totalReviewed = 0
		$(this.diffList).each(function(i, diff){
			if (diff.isReviewed) {
				totalReviewed++;
			}
		});

		var longMessage = totalReviewed + " out of " + this.diffList.length + " files reviewed.";
		this.customStatsSpan().text(longMessage);

		var shortMessage = totalReviewed + "/" + this.diffList.length;
		document.title = totalReviewed == 0 ? this.originalTitle : shortMessage + " " + this.originalTitle;
	}

	addCustomDiffStatistics() {
		$("div.toc-diff-stats").append('<span class="github-pr-custom-stats">0 out of 0</span>');
	}

	customStatsSpan() {
		return $(".github-pr-custom-stats");
	}
}

new GitHubPR();
