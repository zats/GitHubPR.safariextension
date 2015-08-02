'use strict';

var Diff = {
	alloc: function(){
		return {
			init: function(id) {
				this.id = id;
				this.hash = this.quickHash(this.changesContents());
				this.setIsReviewed(localStorage[id] === this.hash);
				return this;
			},
			
			setIsReviewed: function(bool) {
				this._isReviewed = bool;
				if (bool) {
					localStorage[this.id] = this.hash;
				} else {
					localStorage.removeItem(this.id);
				}
				this.updateUI()	
			},

			isReviewed: function() {
				return this._isReviewed;	
			},

			updateUI: function() {
				this.updateCodeBlock(this.diffContents());
				this.updateTOCLink();
				this.updateMarkAsReviewedLink();
			},
			
			updateLink: function(link){
				if (this.isReviewed()) {
					link.addClass("github-pr-link-reviewed");
				} else {
					link.removeClass("github-pr-link-reviewed");
				}
			},
			
			markAsReviewedLink: function(){
				return $("a#mark-as-reviewed-" + this.id)
			},

			updateMarkAsReviewedLink: function(){
				var link = this.markAsReviewedLink();
				if (this.isReviewed()) {
					$(link).addClass("github-pr-link-mark-as-reviewed");
				} else {
					$(link).removeClass("github-pr-link-mark-as-reviewed");
				}
			},

			updateTOCLink: function() {
				var link = this.TOCLink();
				if (this.isReviewed()) {
					$(link).addClass("github-pr-toc-reviewed");
				} else {
					$(link).removeClass("github-pr-toc-reviewed");
				}
			},

			updateCodeBlock: function(codeBlock) {
				if (this.isReviewed()) {
					$(codeBlock).addClass("github-pr-code-reviewed");
				} else {
					$(codeBlock).removeClass("github-pr-code-reviewed");
				}
			},

			contents: function() {
				return $("a[name='diff-" + this.id + "']").next();
			},

			TOCLink: function() {
				return $("div#toc").find("a[href='#diff-" + this.id + "']");
			},

			diffContents: function() {
				return this.contents().find(".blob-wrapper");
			},

			changesContents: function() {
				var contents = this.diffContents();
				var result = ""
				$(contents).find(".blob-code-addition,.blob-code-deletion").each(function(i, td){
					result += $(td).text();
				});
				return result;
			},

			quickHash: function(string) {
				return window.btoa(encodeURIComponent(escape(string)));
			}
		}
	}
};


var GitHubPR = {
	alloc: function(){
		return {
			init: function() {
				this.diffList = this.buildDiffList();
				this.addMarkAsReviewedButton(this.diffList);
				
				this.addCustomDiffStatistics();

				this.originalTitle = document.title;
				this.updateGlobalCounter();

				return this;
			},

			buildDiffList: function() {
				return $("div[class^='file'][id^='diff']").map(function(x, y){
					var diffId = $(y).prev().attr('name').replace(/diff\-([a-f0-9]+)/, '$1'); 
					var diff = Diff.alloc().init(diffId);
					return diff;
				});
			},

			addMarkAsReviewedButton: function(diffList) {
				var self = this
				$(diffList).each(function(i, diff){
					var fileActions = diff.contents().find(".file-actions");
					var link = $('<a class="octicon-btn tooltipped tooltipped-nw" id="mark-as-reviewed-' + diff.id + '" href="#' + diff.id + '" aria-label="Mark file as reviewed"><span class="octicon octicon-check"></span></a>');
					link.click(function(){
						diff.setIsReviewed(!diff.isReviewed());
						diff.updateLink(link);
						self.updateGlobalCounter();
						return false;	
					});
					fileActions.append(link);
					diff.updateUI();
				});
			},

			updateGlobalCounter: function() {
				var totalReviewed = 0
				$(this.diffList).each(function(i, diff){
					if (diff.isReviewed()) {
						totalReviewed++;
					}
				});

				var longMessage = totalReviewed + " out of " + this.diffList.length + " files reviewed.";
				this.customStatsSpan().text(longMessage);

				var shortMessage = totalReviewed + "/" + this.diffList.length;
				document.title = totalReviewed == 0 ? this.originalTitle : shortMessage + " " + this.originalTitle;
			},

			addCustomDiffStatistics: function() {
				$("div.toc-diff-stats").append('<span class="github-pr-custom-stats">0 out of 0</span>');
			},

			customStatsSpan: function() {
				return $(".github-pr-custom-stats");
			}
		}
	}
};

GitHubPR.alloc().init();
